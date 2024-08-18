'''
with 1623 comments requested, 8 workers are chosen
dividing the work yeilds 202.875, 
  1623 % 8 = 7
so 7/8 workers will get 203 while 1/8 gets 202

among the individual worker batches,
the each worker gets ceil(worker_req/50) = 5 batches of work
with each batch yeilding 202/5 = 40.5
  202 % 5 = 2
so 2/5 batches get 41 while 3/5 get 40
'''

from math import ceil
import concurrent.futures
from typing import Dict, List, Tuple

from flask import jsonify
from .gemini_service import generate_mock_comments
from .data_modules import Status
from firebase_admin import firestore
import random


CHUNK_SIZE = 50
MAX_WORKERS = 8
DocRef3Tuple = Tuple[firestore.DocumentReference, firestore.DocumentReference, firestore.DocumentReference]


def _update_generation_counts(
        user_ref: firestore.DocumentReference, 
        product_ref: firestore.DocumentReference, 
        gen_request_ref: firestore.DocumentReference
    ) -> None:
    user_ref.update({"total_comment_generations": firestore.Increment(1)})

    product_ref.update({"total_comments": firestore.Increment(1), "last_updated": firestore.SERVER_TIMESTAMP})

    gen_request_ref.update({"num_comments_generated": firestore.Increment(1)})

def _calculate_worker_batches(total_requested: int):
    # cap workers at 8
    num_workers = min(
        MAX_WORKERS,
        ceil(total_requested/CHUNK_SIZE)
    )

    load_per_worker, worker_remainder = int(total_requested/num_workers), total_requested % num_workers

    worker_loads = [
        load_per_worker + (1 if i < worker_remainder else 0) \
        for i in range(num_workers)
    ] #e.g. [41,41,40,40]
    # print(f"Worker Loads: {worker_loads}\n")

    # for each worker, determine the batches
    worker_batches = []
    for i in range(num_workers):
        worker_load = worker_loads[i]
        num_batches = ceil(worker_load/CHUNK_SIZE)
        load_per_batch, batch_remainder = int(worker_load/num_batches), worker_load % num_batches
        
        worker_batches.append(
            [
                load_per_batch + (1 if j < batch_remainder else 0) \
                for j in range(num_batches)
            ]
        )

    
    # for i in range(num_workers):
    #     print(f"Worker {i}:\t{worker_batches[i]}")

    # print(f"SUM:\t", sum(sum(l) for l in worker_batches))

    return num_workers, worker_batches

def _process_worker_batches(
        firestore_refs: DocRef3Tuple,
        worker_batches: List[int],
        product_data: Dict[str, str],
        pollution_level: str = "Low"):
    
    user_ref, product_ref, gen_request_ref = firestore_refs
    generated_comments_ref = gen_request_ref.collection("generated_comments")

    try:
        for batch_load in worker_batches:
            # generate the comments
                comments_batch = generate_mock_comments(
                    product_info_dict=product_data,
                    pollution_level=pollution_level,
                    num_to_generate=batch_load)

                # jumble the comments
                random.shuffle(comments_batch)

                # store the comments
                for comment_data in comments_batch:
                    _update_generation_counts(user_ref, product_ref, gen_request_ref)
                    generated_comments_ref.add({
                        "comment": comment_data["comment"],
                        "relevancy_score": float(comment_data["relevancy_score"]),  
                        "offensivity_score": float(comment_data["offensivity_score"]), 
                        "timestamp": firestore.SERVER_TIMESTAMP})       
                         
    except Exception as e:
        print("\t\tMAJOR ERROR @_generate_initial_comments", e)
        return jsonify({"error": "An error occurred.", "message": str(e)}), 500  

def parallelize_comment_tasks(
        firestore_refs: DocRef3Tuple,
        total_requested: int,
        product_data: Dict[str, str],
        pollution_level: str = "Low"):

    _, _, gen_request_ref = firestore_refs
    gen_request_ref.update({"status": Status.LOADING.value})

    # obtain set of workers and their batches
    num_workers, worker_batches = _calculate_worker_batches(total_requested=total_requested)

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
        for i in range(num_workers):
            executor.submit(
                _process_worker_batches,
                firestore_refs,
                worker_batches[i],
                product_data,
                pollution_level
            )
    

    gen_request_ref.update({"status": Status.PRELIM_SUCCESS.value})


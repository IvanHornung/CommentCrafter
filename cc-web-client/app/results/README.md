# `page.tsx` Explaination

There's a lot going on this file and some of it is pretty counterintuitive while some of it is some absolutely new SWE concepts. This file and its logic is a great learning experience.

## Page Navigation and `useEffect` Hook

When the use clicks on `Next` or `Previous` to navigate to another page, `currentPage` gets updated 

AND

the `useEffect` hook is listening for changes in `currentPage`. So whenever `currentPage` changes, `useEffect` triggers `fetchCommentsForPage`.

## `fetchCommentsForPage` Function
<!-- - complete misnomer and thus you must change its name, but this section will describe what it does -->


### Check if comments are already loaded
This function first sees if the comments _for the requested page_ are already loaded in the `comments` state variable

If they're already loaded, the function returns early and doesnt make any API call


### Make an API Call If Needed

If the comments for the specific page are not yet loaded, this function will make an API call to fetch them. 

The new comments are then stored to the `comments` state variable using the `setComments` function.

### Start Polling (for Page 1)

If the page is `1` AND there are more comments to be generated (>50), indicated by `newJobID`:

The polling function `pollForRemaningComments` is started in the background and gradually loads the rest of the comments into the `comments` state var.


## Displaying the Comments

This is only reached if not in a loading state. Once `fetchCommentsForPage` has either fetched new comments or determined that the comments are already loaded, the component can now begin rendering

The indices are calculated and the `comments` array is slices according to them.

The slicing is passed into the UI, which will then render them into the screen.





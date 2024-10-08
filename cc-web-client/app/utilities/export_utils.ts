// exportUtils.ts

import { CommentData } from "./comment_fetching";


function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

export function downloadJSON(comments: CommentData[], productLink: string, productName: string, productDescription: string, filename: string = 'export.json') {
    function convertToJSON(comments: CommentData[]): string {
        const data = {
            productLink: productLink,
            productName: productName,
            productDescription: productDescription,
            comments: comments
        };
        return JSON.stringify(data, null, 2);
    }

    const jsonString = convertToJSON(comments);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, filename);
}

export function downloadXML(comments: CommentData[], productLink: string, productName: string, productDescription: string, filename: string = 'export.xml') {
    function escapeXML(str: string): string {
        return str.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
    }

    function convertToXML(comments: CommentData[]): string {
        let xml = `<product>\n`;
        xml += `    <productLink>${escapeXML(productLink)}</productLink>\n`;
        xml += `    <productName>${escapeXML(productName)}</productName>\n`;
        xml += `    <productDescription>${escapeXML(productDescription)}</productDescription>\n`;
        xml += `    <comments>\n`;
        comments.forEach(comment => {
            xml += `
        <comment>
            <text>${escapeXML(comment.comment)}</text>
            <relevancy_score>${comment.relevancy_score}</relevancy_score>
            <offensivity_score>${comment.offensivity_score}</offensivity_score>
            <timestamp>${comment.timestamp}</timestamp>
        </comment>`;
        });
        xml += `\n    </comments>\n</product>`;
        return xml.trim();
    }
    
    const xmlString = convertToXML(comments);
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    downloadBlob(blob, filename);
}

export function downloadCSV(comments: CommentData[], productLink: string, productName: string, productDescription: string, filename: string = 'export.csv') {
    function convertToCSV(comments: CommentData[]): string {
        const header = `Product Link:,${productLink}\nProduct Name:,${productName}\nProduct Description:,${productDescription}\ncomment,relevancy_score,offensivity_score,timestamp`;
        const rows = comments.map(comment => 
            `${comment.comment.replace(/,/g, '')},${comment.relevancy_score},${comment.offensivity_score},${comment.timestamp}`
        );
        return [header, ...rows].join("\n");
    }

    const csvString = convertToCSV(comments);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, filename);
}


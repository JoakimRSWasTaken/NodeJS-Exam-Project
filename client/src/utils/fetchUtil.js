// @ts-nocheck så vi ikke får TypeScript checks på datatyper. 
// Jeg ved ikke hvorfor jeg får dette, når jeg har valgt at oprette projektet med JS og ikke TS

export async function fetchGet(endpoint) {

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        credentials: 'include'
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.errorMessage);
    }

    return result;
}

export async function fetchPost(endpoint, body) {

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.errorMessage);
    }

    return result;
}
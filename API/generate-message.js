// api/generate-message.js

// Esta es una función serverless. Se ejecuta en el servidor, no en el navegador.
export default async function handler(request, response) {
    // Obtiene la clave de API de las variables de entorno (almacenada de forma segura en Vercel)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'La clave de API no está configurada en el servidor.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const userQuery = "Escribe un mensaje corto, poético y muy amoroso para una persona muy especial. El tono debe ser dulce y sincero. Debe ser de no más de 30 palabras.";

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }]
    };

    try {
        const fetchResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!fetchResponse.ok) {
            const errorBody = await fetchResponse.text();
            console.error("Error desde la API de Google:", errorBody);
            return response.status(fetchResponse.status).json({ error: `Error de la API de Google: ${fetchResponse.statusText}` });
        }

        const result = await fetchResponse.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el mensaje. Intenta de nuevo.";

        // Envía solo el texto generado de vuelta a la página
        return response.status(200).json({ message: text });

    } catch (error) {
        console.error("Error en la función del servidor:", error);
        return response.status(500).json({ error: 'Error interno del servidor.' });
    }
}
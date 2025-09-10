// api/generate-message.js

// Constantes para una configuración más sencilla y clara
const MODEL_NAME = 'gemini-1.5-flash-latest';
const USER_QUERY = "Escribe un mensaje breve (máximo 30 palabras), poético y muy amoroso para mi novia Karen. Cada vez el mensaje debe sonar único y distinto, sin repetir frases anteriores. El tono debe ser dulce, sincero y personal. Incluye obligatoriamente al menos una de estas palabras: amorcito, Karen, Karencita, corazón, vida, preciosa, niña.";

// Esta es una función serverless. Se ejecuta en el servidor, no en el navegador.
export default async function handler(request, response) {
    // Solo permitir peticiones GET
    if (request.method !== 'GET') {
        return response.status(405).setHeader('Allow', 'GET').json({ error: 'Method Not Allowed' });
    }

    // Obtiene la clave de API de las variables de entorno (almacenada de forma segura en Vercel)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'La clave de API no está configurada en el servidor.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: USER_QUERY }] }],
    };

    try {
        const fetchResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!fetchResponse.ok) {
            const errorBody = await fetchResponse.text();
            console.error("Error desde la API de Google:", fetchResponse.status, errorBody);
            // Intentamos interpretar el error de la API para un mensaje más útil
            try {
                const errorJson = JSON.parse(errorBody);
                const message = errorJson?.error?.message || fetchResponse.statusText;
                return response.status(fetchResponse.status).json({ error: `Error de la API de Google: ${message}` });
            } catch (e) {
                return response.status(fetchResponse.status).json({ error: `Error de la API de Google: ${fetchResponse.statusText}` });
            }
        }

        const result = await fetchResponse.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("Respuesta inesperada de la API de Gemini:", JSON.stringify(result, null, 2));
            return response.status(500).json({ message: "No se pudo generar el mensaje. La respuesta de la API estaba vacía." });
        }

        return response.status(200).json({ message: text });

    } catch (error) {
        console.error("Error en la función del servidor:", error);
        return response.status(500).json({ error: 'Error interno del servidor.' });
    }
}
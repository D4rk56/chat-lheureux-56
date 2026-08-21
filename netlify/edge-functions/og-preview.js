export default async (request, context) => {
  const url = new URL(request.url);
  const apiKey = "AIzaSyCrmwfjhttviYl1bHXOS67oJY41kM2QVXE";

  // Route API pour convertir et servir l'image binaire du chat à Facebook
  if (url.pathname === "/api/cat-image" || url.pathname.startsWith("/api/cat-image")) {
    const catId = url.searchParams.get("id");
    const fallbackImg = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop";
    
    if (!catId) return Response.redirect(fallbackImg, 302);

    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats/${catId}?key=${apiKey}`;
      const res = await fetch(firestoreUrl);
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields || {};

        let photoData = "";
        if (fields.photos?.arrayValue?.values?.length > 0) {
          photoData = fields.photos.arrayValue.values[0].stringValue || "";
        } else if (fields.image?.stringValue) {
          photoData = fields.image.stringValue;
        }

        if (photoData.startsWith("data:image")) {
          const parts = photoData.split(",");
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const base64String = parts[1];

          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          return new Response(bytes, {
            status: 200,
            headers: {
              "content-type": mimeType,
              "cache-control": "public, max-age=86400, s-maxage=86400",
            },
          });
        } else if (photoData.startsWith("http")) {
          return Response.redirect(photoData, 302);
        }
      }
    } catch (err) {
      console.error("Erreur image binaire:", err);
    }

    return Response.redirect(fallbackImg, 302);
  }

  // Interception des robots de réseaux sociaux
  const userAgent = request.headers.get("user-agent") || "";
  const isSocialBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Discordbot|Pinterest|Slackbot/i.test(userAgent);

  if (!isSocialBot) {
    return context.next ? context.next() : undefined;
  }

  const catId = url.searchParams.get("id");
  let catData = null;
  let resolvedCatId = catId;

  if (catId) {
    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats/${catId}?key=${apiKey}`;
      const res = await fetch(firestoreUrl);
      if (res.ok) {
        const data = await res.json();
        catData = data.fields || {};
      }
    } catch (err) {
      console.error("Erreur fetch catId:", err);
    }
  }

  // Si l'ID est introuvable ou invalide, secours sur le premier chat réel disponible dans Firestore
  if (!catData) {
    try {
      const listUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats?pageSize=1&key=${apiKey}`;
      const res = await fetch(listUrl);
      if (res.ok) {
        const listData = await res.json();
        if (listData.documents && listData.documents.length > 0) {
          const doc = listData.documents[0];
          catData = doc.fields || {};
          const nameParts = doc.name ? doc.name.split("/") : [];
          resolvedCatId = nameParts[nameParts.length - 1] || catId;
        }
      }
    } catch (err) {
      console.error("Erreur fetch list chats:", err);
    }
  }

  // Données extraites ou fallback
  const name = catData?.name?.stringValue || "Chat à l'adoption";
  const sex = catData?.sex?.stringValue || catData?.gender?.stringValue || "Femelle";
  const age = catData?.age?.stringValue ? `, ${catData.age.stringValue}` : "";
  const location = catData?.location?.stringValue || "Morbihan (56)";
  const rawDesc = catData?.description?.stringValue || "Découvrez nos protégés à l'adoption chez Chat L'Heureux 56 dans le Morbihan.";

  let photoData = "";
  if (catData?.photos?.arrayValue?.values?.length > 0) {
    photoData = catData.photos.arrayValue.values[0].stringValue || "";
  } else if (catData?.image?.stringValue) {
    photoData = catData.image.stringValue;
  }

  let photoUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop";
  if (photoData.startsWith("data:image")) {
    photoUrl = `${url.origin}/api/cat-image?id=${resolvedCatId || catId}`;
  } else if (photoData.startsWith("http")) {
    photoUrl = photoData;
  }

  const dynamicTitle = `🐾 ${name} (${sex}${age}) — À l'adoption à ${location}`;
  const dynamicDesc = rawDesc.length > 160 ? rawDesc.substring(0, 157) + "..." : rawDesc;
  
  // Utilisation systématique de l'URL complète demandée avec ses paramètres
  const currentUrl = url.href;

  const botHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${dynamicTitle}</title>
    <meta name="description" content="${dynamicDesc}">
    <meta property="fb:app_id" content="966242223397117">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Chat L'Heureux 56">
    <meta property="og:title" content="${dynamicTitle}">
    <meta property="og:description" content="${dynamicDesc}">
    <meta property="og:image" content="${photoUrl}">
    <meta property="og:image:secure_url" content="${photoUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${dynamicTitle}">
    <meta name="twitter:description" content="${dynamicDesc}">
    <meta name="twitter:image" content="${photoUrl}">
</head>
<body>
    <h1>${dynamicTitle}</h1>
    <p>${dynamicDesc}</p>
    <img src="${photoUrl}" alt="${name}">
</body>
</html>`;

  return new Response(botHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
};
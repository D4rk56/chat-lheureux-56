export default async (request, context) => {
  try {
    const url = new URL(request.url);
    const secureOrigin = url.origin.replace(/^http:\/\//i, "https://");
    const apiKey = Netlify.env.get("FIREBASE_API_KEY") || Netlify.env.get("VITE_FIREBASE_API_KEY");
    const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";

    // 1. Route API pour convertir et servir l'image binaire du chat à WhatsApp / Facebook (SANS REDIRECTION 302)
    if (url.pathname === "/api/cat-image" || url.pathname.startsWith("/api/cat-image")) {
      let catId = url.searchParams.get("id");
      if (!catId && url.pathname.startsWith("/api/cat-image/")) {
        const segs = url.pathname.replace(/^\/api\/cat-image\//, "").split("/");
        if (segs[0]) {
          catId = decodeURIComponent(segs[0]);
        }
      }
      if (catId) {
        catId = catId.replace(/\.(jpg|jpeg|png|webp)$/i, "");
      }

      // Fonction helper pour renvoyer la couverture locale par défaut avec statut 200 direct
      const serveFallbackCover = async () => {
        try {
          const coverRes = await fetch(`${secureOrigin}/og-cover.jpg`);
          if (coverRes.ok) {
            const coverBuffer = await coverRes.arrayBuffer();
            return new Response(coverBuffer, {
              status: 200,
              headers: {
                "Content-Type": "image/jpeg",
                "Content-Length": String(coverBuffer.byteLength),
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        } catch (e) {
          // Fallback sur image externe si le fetch local échoue
        }
        return Response.redirect("https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop", 302);
      };

      if (!catId) {
        return await serveFallbackCover();
      }

      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats/${catId}${keyParam}`;
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
            const base64String = parts[1].replace(/\s+/g, "");

            const binaryString = atob(base64String);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            return new Response(bytes, {
              status: 200,
              headers: {
                "Content-Type": mimeType,
                "Content-Length": String(bytes.length),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400, s-maxage=86400",
                "Access-Control-Allow-Origin": "*",
              },
            });
          } else if (photoData.startsWith("http")) {
            // WhatsApp refuse les redirections 302 pour les images : on proxifie le binaire directement
            try {
              const remoteRes = await fetch(photoData);
              if (remoteRes.ok) {
                const cType = remoteRes.headers.get("content-type") || "image/jpeg";
                const remoteBuffer = await remoteRes.arrayBuffer();
                return new Response(remoteBuffer, {
                  status: 200,
                  headers: {
                    "Content-Type": cType,
                    "Content-Length": String(remoteBuffer.byteLength),
                    "Cache-Control": "public, max-age=86400, s-maxage=86400",
                    "Access-Control-Allow-Origin": "*",
                  },
                });
              }
            } catch (proxyErr) {
              console.error("Erreur proxy image http:", proxyErr);
            }
          }
        }
      } catch (err) {
        console.error("Erreur image binaire:", err);
      }

      return await serveFallbackCover();
    }

    // 2. Interception des robots de réseaux sociaux (WhatsApp, Facebook, Twitter, Discord, etc.)
    const userAgent = request.headers.get("user-agent") || "";
    const isSocialBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Discordbot|Pinterest|Slackbot|vkShare|W3C_Validator|redditbot|Applebot|Googlebot/i.test(userAgent);

    // Pour les visiteurs normaux (navigateurs humains), passer la main à Netlify via context.next()
    if (!isSocialBot) {
      return context.next();
    }

    let catId = url.searchParams.get("id");
    if (!catId && url.pathname.startsWith("/chat/")) {
      const segments = url.pathname.replace(/^\/chat\//, "").split("/");
      if (segments[0]) {
        catId = decodeURIComponent(segments[0]);
      }
    }
    let catData = null;
    let resolvedCatId = catId;

    if (catId) {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats/${catId}${keyParam}`;
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
        const listUrl = `https://firestore.googleapis.com/v1/projects/chat-lheureux-56/databases/(default)/documents/chats?pageSize=1${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ""}`;
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

    const status = catData?.status?.stringValue || "Disponible";
    const adoptedAtStr = catData?.adoptedAt?.stringValue || catData?.updatedAt?.stringValue || catData?.createdAt?.stringValue;
    let isExpiredAdopted = false;
    let daysAdopted = 0;

    if (status === "Adopté" && adoptedAtStr) {
      const adoptDate = new Date(adoptedAtStr);
      if (!isNaN(adoptDate.getTime())) {
        daysAdopted = Math.max(0, Math.floor((Date.now() - adoptDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (daysAdopted >= 60) {
          isExpiredAdopted = true;
        }
      }
    }

    // L'URL de la photo pointe TOUJOURS vers /api/cat-image/[id].jpg pour garantir un statut 200 direct (sans redirect 302 pour WhatsApp)
    const photoUrl = resolvedCatId 
      ? `${secureOrigin}/api/cat-image/${resolvedCatId}.jpg`
      : `${secureOrigin}/og-cover.jpg`;

    let dynamicTitle = `🐾 ${name} (${sex}${age}) — À l'adoption à ${location}`;
    let dynamicDesc = rawDesc.length > 160 ? rawDesc.substring(0, 157) + "..." : rawDesc;

    if (isExpiredAdopted) {
      dynamicTitle = `🎉 ${name} coule des jours heureux ! — Chat L'Heureux 56`;
      dynamicDesc = `${name} a été adopté(e) il y a plus de 60 jours grâce à l'association Chat L'Heureux 56. Découvrez tous nos protégés actuellement à l'adoption dans le Morbihan !`;
    } else if (status === "Adopté") {
      const daysLabel = daysAdopted === 0 ? "aujourd'hui" : (daysAdopted === 1 ? "hier" : `il y a ${daysAdopted}j`);
      dynamicTitle = `🎉 ${name} a été adopté(e) (${daysLabel}) — Chat L'Heureux 56`;
      dynamicDesc = `${name} coule désormais des jours heureux dans sa famille pour la vie. Découvrez tous nos chats à l'adoption chez Chat L'Heureux 56 dans le Morbihan !`;
    }
    
    // URL sécurisée et complète
    const currentUrl = url.href.replace(/^http:\/\//i, "https://");

    // Important pour WhatsApp : og:image et og:title placés dès le début du <head>
    const botHtml = `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb#">
<head>
    <meta charset="UTF-8">
    <title>${dynamicTitle}</title>
    <meta name="description" content="${dynamicDesc}">
    <link rel="canonical" href="${currentUrl}">
    
    <!-- Open Graph Image pour WhatsApp & Facebook (En tout premier dans le head) -->
    <meta property="og:image" content="${photoUrl}">
    <meta property="og:image:secure_url" content="${photoUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${name}">
    
    <!-- Identifiant officiel Facebook App -->
    <meta property="fb:app_id" content="966242223397117">
    
    <!-- Open Graph Métadonnées -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Chat L'Heureux 56">
    <meta property="og:title" content="${dynamicTitle}">
    <meta property="og:description" content="${dynamicDesc}">
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
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("OG Preview Edge Function error:", err);
    return context.next();
  }
};

export const config = {
  path: ["/chat-detail*", "/chat/*", "/api/cat-image*"],
  onError: "bypass",
};
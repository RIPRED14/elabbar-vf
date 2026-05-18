const token = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJULWtPLV8tU0pGdmR4LThkd0lSYWZIalpnMkdQSWFXNGR1bnBMeHR2bUtnIn0.eyJleHAiOjE3NzkwNTk3OTAsImlhdCI6MTc3OTA1OTQ5MCwiYXV0aF90aW1lIjoxNzc5MDU5NDM4LCJqdGkiOiJvbnJ0YWM6M2I4NTM2YTgtN2MwYi05MzMwLWYxYTUtYWNjMGY2NjY2OWQyIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLm50d3RlYy5jb20vcmVhbG1zL250c2FtYWsiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiMzcwYWY0ZjAtYzcyNS00OGE3LWFjNmEtODRmZTdmYjU0NThiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibnRzYW1hay13ZWIiLCJzaWQiOiI2ZGU2NjQxZS02MmQzLTQ2MGYtOWJjOS1iMjE0ZjY0ZGQ5ODUiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vbnRzYW1hay5udHd0ZWMuY29tIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW50c2FtYWsiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsibnRzYW1hay13ZWIiOnsicm9sZXMiOlsiVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZmYtaGFtemEifQ.SloAm419dhMc1bzpQUqngjvpRAtZi5kvHdHmL65jNisKd1UR10MYJ3PaZzX4sz8piLqMxBvuJ7Z1LEgjGDG2xDzkHvlJM9i_7YL_ieBWRZtSYz7y0BZZ79LPYAWaRXxnQzqvRv9V-7hOywtxRJiiiJVaDPB7zELb00TRSWp_d-nulpxoILBzKOc0302XuOqC95iOV20i2Hf0wXx4DRc35oSIc_PgUz44auf3MhDs74RIzZxWZUfO0bevJPK14no8bzHorkQzpzP3Oqehyu1iM83ZHTLV6pVFoDAZPN8k4f4KP9MUDe129U_bzFnDQN27IcPiOeJJbAS--yNFFbE1cw";

async function testDirect() {
  console.log("Testing direct fetch to Ntsamak API...");
  try {
    const res = await fetch("https://ntsamak-api.ntwtec.com/factureFrs/byFilter", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dateDu: "2025-11-01T12:00:00.000Z",
        dateAu: "2026-05-18T12:00:00.000Z",
        fournisseurIds: [],
        societeIds: [47, 48, 49],
        types: ["FF", "FP"],
        usineIds: [],
        id: 0,
        origines: ["D"]
      })
    });
    
    console.log("Direct Status:", res.status);
    const json = await res.json();
    console.log(`Direct Success! Retrieved ${json.length} records.`);
  } catch (e) {
    console.error("Direct Error:", e.message);
  }
}

testDirect();

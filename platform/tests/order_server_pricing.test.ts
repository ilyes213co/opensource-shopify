import assert from "node:assert";
import { NextRequest } from "next/server";
import { POST } from "../app/api/orders/route";

interface MockOptions {
  store?: any;
  product?: any;
  shippingRate?: any;
  wilaya?: any;
}

function buildMockSupabase(opts: MockOptions = {}) {
  const capturedInserts: any[] = [];

  const defaultStore = {
    id: "store-ts-01",
    name: "Boutique TS Validée",
    status: "published",
    settings: {},
  };
  const effectiveStore = opts.store !== undefined ? opts.store : defaultStore;

  const defaultProduct = {
    id: "prod-ts-100",
    name: "Cafetière Espresso",
    price: 4500,
    status: "active",
    store_id: effectiveStore ? effectiveStore.id : "store-ts-01",
    images: ["https://example.com/coffee.jpg"],
    options: [],
    stock_quantity: 15,
  };
  const effectiveProduct = opts.product !== undefined ? opts.product : defaultProduct;

  const defaultShippingRate = {
    store_id: effectiveStore ? effectiveStore.id : "store-ts-01",
    wilaya_id: 16,
    price_home: 600,
    price_desk: 350,
  };
  const effectiveShippingRate = opts.shippingRate !== undefined ? opts.shippingRate : defaultShippingRate;

  const defaultWilaya = {
    id: 16,
    name: "Alger",
    price_home: 500,
    price_desk: 300,
  };
  const effectiveWilaya = opts.wilaya !== undefined ? opts.wilaya : defaultWilaya;

  const mockClient = {
    from: (table: string) => {
      const query: any = {
        _table: table,
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: async () => {
          if (table === "stores") return { data: effectiveStore, error: null };
          if (table === "products") return { data: effectiveProduct, error: null };
          if (table === "shipping_rates") return { data: effectiveShippingRate, error: null };
          if (table === "wilayas") return { data: effectiveWilaya, error: null };
          return { data: null, error: null };
        },
        single: async () => {
          if (table === "stores") return { data: effectiveStore, error: null };
          if (table === "products") return { data: effectiveProduct, error: null };
          if (table === "orders") {
            const last = capturedInserts[capturedInserts.length - 1] || { id: "order-test-ts-123" };
            return { data: { id: "order-test-ts-123", ...last }, error: null };
          }
          return { data: null, error: null };
        },
        insert: (payload: any) => {
          capturedInserts.push(payload);
          return {
            select: () => ({
              single: async () => ({
                data: { id: "order-test-ts-123", ...payload },
                error: null,
              }),
            }),
          };
        },
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      };
      return query;
    },
    _capturedInserts: capturedInserts,
  };

  return mockClient;
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log("=== Tests Next.js Route (/api/orders) - Recalcul Côté Serveur ===");

  await runTest(
    "1. total_amount: 1 envoyé par le client -> ignoré, total recalculé et persisté par le serveur",
    async () => {
      const mockSb = buildMockSupabase();
      (globalThis as any).__mockSupabaseAdmin = mockSb;

      // Produit = 4500 DZD x 2 = 9000 + livraison 600 = 9600 DZD
      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify({
          store_id: "store-ts-01",
          customer_name: "Karim Benali",
          customer_phone: "0550123456",
          customer_address: "15 Rue Ben M'hidi, Alger",
          wilaya_id: 16,
          ship_mode: "domicile",
          total_amount: 1, // Tentative de fraude client
          items: [{ product_id: "prod-ts-100", qty: 2, price: 1 }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.total_amount, 9600);
      assert.strictEqual(data.subtotal, 9000);
      assert.strictEqual(data.shipping_fee, 600);

      // Vérification base
      assert.strictEqual(mockSb._capturedInserts.length, 1);
      assert.strictEqual(mockSb._capturedInserts[0].total_amount, 9600);
    }
  );

  await runTest(
    "2. items[].price: 1 envoyé par le client -> ignoré, prix unitaire issu de products.price",
    async () => {
      const mockSb = buildMockSupabase();
      (globalThis as any).__mockSupabaseAdmin = mockSb;

      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify({
          store_id: "store-ts-01",
          customer_name: "Karim Benali",
          customer_phone: "0660123456",
          customer_address: "15 Rue Ben M'hidi, Alger",
          wilaya_id: 16,
          ship_mode: "domicile",
          total_amount: 999999,
          items: [{ product_id: "prod-ts-100", qty: 1, price: 1 }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.subtotal, 4500);
      assert.strictEqual(data.total_amount, 5100);

      const savedItem = mockSb._capturedInserts[0].items[0];
      assert.strictEqual(savedItem.price, 4500);
    }
  );

  await runTest("3. quantité 0 -> refus HTTP 400", async () => {
    const mockSb = buildMockSupabase();
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0770123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-ts-100", qty: 0 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /quantité.*doit être un entier compris entre 1 et 10/i);
  });

  await runTest("4. quantité négative (-1) -> refus HTTP 400", async () => {
    const mockSb = buildMockSupabase();
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0770123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-ts-100", qty: -1 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /quantité.*doit être un entier compris entre 1 et 10/i);
  });

  await runTest("5. quantité 9999 (> 10) -> refus HTTP 400", async () => {
    const mockSb = buildMockSupabase();
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0770123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-ts-100", qty: 9999 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /quantité.*doit être un entier compris entre 1 et 10/i);
  });

  await runTest("6. produit d'une autre boutique -> refus HTTP 400", async () => {
    const alienProduct = {
      id: "prod-alien",
      name: "Produit D'un Autre Store",
      price: 2500,
      status: "active",
      store_id: "store-OTHER-999",
      images: [],
      options: [],
    };
    const mockSb = buildMockSupabase({ product: alienProduct });
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0550123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-alien", qty: 1 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /n'appartient pas à cette boutique/i);
  });

  await runTest("7. produit inactif (draft) -> refus HTTP 400", async () => {
    const draftProduct = {
      id: "prod-draft",
      name: "Produit Brouillon",
      price: 3500,
      status: "draft",
      store_id: "store-ts-01",
      images: [],
      options: [],
    };
    const mockSb = buildMockSupabase({ product: draftProduct });
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0550123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-draft", qty: 1 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /n'est pas actif/i);
  });

  await runTest("8. wilaya inconnue (wilaya_id: 999) -> refus HTTP 400", async () => {
    const mockSb = buildMockSupabase();
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Karim Benali",
        customer_phone: "0550123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 999,
        ship_mode: "domicile",
        items: [{ product_id: "prod-ts-100", qty: 1 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /wilaya.*invalide ou inconnue/i);
  });

  await runTest("9. boutique non publiée (status: draft) -> refus HTTP 400", async () => {
    const draftStore = {
      id: "store-draft-01",
      name: "Store En Conception",
      status: "draft",
    };
    const mockSb = buildMockSupabase({ store: draftStore });
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-draft-01",
        customer_name: "Karim Benali",
        customer_phone: "0550123456",
        customer_address: "15 Rue Ben M'hidi, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        items: [{ product_id: "prod-ts-100", qty: 1 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /statut non publié/i);
  });

  await runTest("10. cas normal -> 200, montant calculé par le serveur", async () => {
    const customRate = {
      store_id: "store-ts-01",
      wilaya_id: 16,
      price_home: 700,
      price_desk: 400,
    };
    const mockSb = buildMockSupabase({ shippingRate: customRate });
    (globalThis as any).__mockSupabaseAdmin = mockSb;

    // Produit 4500 x 3 = 13500 + livraison boutique 700 = 14200 DZD
    const req = new NextRequest("http://localhost:3000/api/orders", {
      method: "POST",
      body: JSON.stringify({
        store_id: "store-ts-01",
        customer_name: "Amira Kaci",
        customer_phone: "+213 770 12 34 56",
        customer_address: "Boulevard Colonel Amirouche, Alger",
        wilaya_id: 16,
        ship_mode: "domicile",
        notes: "Livrer l'après-midi svp",
        items: [{ product_id: "prod-ts-100", qty: 3, price: 0 }],
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.subtotal, 13500);
    assert.strictEqual(data.shipping_fee, 700);
    assert.strictEqual(data.total_amount, 14200);
    assert.strictEqual(data.order_id, "order-test-ts-123");

    const saved = mockSb._capturedInserts[0];
    assert.strictEqual(saved.total_amount, 14200);
    assert.strictEqual(saved.customer_phone, "0770123456");
    assert.strictEqual(saved.notes, "Livrer l'après-midi svp");
  });

  console.log("\n=== Tous les 10 tests Next.js (/api/orders) ont réussi avec succès ! ===");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

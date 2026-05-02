-- Catégories initiales Luma
INSERT INTO products (id, slug, source_id, source, title, category, status)
VALUES
  (gen_random_uuid(), 'exemple-produit-demo', 'DEMO001', 'manual', 'Produit Démo', 'Maison', 'draft')
ON CONFLICT DO NOTHING;

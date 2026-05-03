alter table orders
add column if not exists checkout_request_id text,
add column if not exists mpesa_receipt text;

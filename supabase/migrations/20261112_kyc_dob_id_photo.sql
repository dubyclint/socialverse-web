-- Manual KYC: date of birth and a photo of the ID card.
alter table public.kyc_requests add column if not exists date_of_birth date;
alter table public.kyc_requests add column if not exists id_photo_path text;

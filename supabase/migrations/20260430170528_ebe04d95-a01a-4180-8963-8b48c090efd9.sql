UPDATE storage.buckets SET file_size_limit = 15728640 WHERE id IN ('avatars','banners');
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'emojis';
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'dm-attachments';
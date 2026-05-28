-- 1. Update existing users: '조세연' and '영민' to Vietnamese
update public.profiles 
set nickname = 'Minh Anh', real_name = 'Nguyen Minh Anh', nationality = 'vi' 
where id = 'f1e0801d-49d5-4197-bf51-8b0512b24a48';

update public.leaderboard 
set nickname = 'Minh Anh', nationality = 'vi' 
where user_id = 'f1e0801d-49d5-4197-bf51-8b0512b24a48';

update public.profiles 
set nickname = 'Tuan', real_name = 'Tran Tuan Anh', nationality = 'vi' 
where id = '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d';

update public.leaderboard 
set nickname = 'Tuan', nationality = 'vi' 
where user_id = '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d';

-- 2. Insert 44 dummy users
DO $$
DECLARE
    new_uid uuid;
    i integer;
    -- Vietnamese names (27)
    vn_nicknames text[] := array['Anh', 'Linh', 'Huong', 'Huy', 'Nam', 'Phong', 'Thao', 'Dung', 'Hai', 'Giang', 'Son', 'Mai', 'Quynh', 'Long', 'Vy', 'Hieu', 'Trang', 'Tung', 'Phuong', 'Lan', 'Khoa', 'Minh', 'Binh', 'Duy', 'Khang', 'Duc Anh', 'Kim Oanh'];
    vn_realnames text[] := array['Le Minh Anh', 'Pham Thuy Linh', 'Le Thi Huong', 'Phan Gia Huy', 'Vu Hoai Nam', 'Dang Thanh Phong', 'Bui Minh Thao', 'Do Tien Dung', 'Ho Thanh Hai', 'Ngo Thu Giang', 'Duong Hong Son', 'Nguyen Thanh Mai', 'Tran Nhu Quynh', 'Pham Hoang Long', 'Le Khanh Vy', 'Hoang Trung Hieu', 'Phan Huyen Trang', 'Vu Thanh Tung', 'Dang Minh Phuong', 'Bui Thi Lan', 'Do Anh Khoa', 'Ho Ngoc Minh', 'Ngo Thanh Binh', 'Duong Quoc Duy', 'Nguyen Gia Khang', 'Tran Duc Anh', 'Pham Kim Oanh'];
    
    -- Chinese names (12)
    zh_nicknames text[] := array['Wei', 'Jing', 'Min', 'Yu', 'Yan', 'Yang', 'Lin', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun'];
    zh_realnames text[] := array['Zhang Wei', 'Wang Jing', 'Li Min', 'Chen Yu', 'Liu Yan', 'Yang Jun', 'Huang Lin', 'Zhao Xin', 'Wu Hao', 'Zhou Ping', 'Xu Fan', 'Sun Lei'];
    
    -- Mongolian names (2)
    mn_nicknames text[] := array['Temulen', 'Khulan'];
    mn_realnames text[] := array['Temulen Bat-Erdene', 'Khulan Altangerel'];
    
    -- Uzbek names (3)
    uz_nicknames text[] := array['Anvar', 'Dilshod', 'Nodira'];
    uz_realnames text[] := array['Anvar Soliev', 'Dilshod Karimov', 'Nodira Akhmedova'];
    
    dummy_email text;
    dummy_balance numeric;
BEGIN
    -- 1. Insert Vietnamese (27)
    FOR i IN 1..27 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        -- Plausible balance between 10,000 KRW and 3,200,000 KRW
        dummy_balance := floor(random() * 3190000 + 10000);
        
        -- Insert into auth.users
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, vn_nicknames[i], 'vi', vn_realnames[i], '010-0000-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || vn_nicknames[i]);
        
        -- Insert into public.leaderboard
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, vn_nicknames[i], 'vi', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 2. Insert Chinese (12)
    FOR i IN 1..12 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'zh_dummy_' || i || '@gachon.ac.kr';
        -- Plausible balance between 20,000 KRW and 4,800,000 KRW
        dummy_balance := floor(random() * 4780000 + 20000);
        
        -- Insert into auth.users
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, zh_nicknames[i], 'zh', zh_realnames[i], '010-1111-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || zh_nicknames[i]);
        
        -- Insert into public.leaderboard
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, zh_nicknames[i], 'zh', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 3. Insert Mongolian (2)
    FOR i IN 1..2 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'mn_dummy_' || i || '@gachon.ac.kr';
        -- Plausible balance between 50,000 KRW and 1,500,000 KRW
        dummy_balance := floor(random() * 1450000 + 50000);
        
        -- Insert into auth.users
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, mn_nicknames[i], 'mn', mn_realnames[i], '010-2222-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || mn_nicknames[i]);
        
        -- Insert into public.leaderboard
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, mn_nicknames[i], 'mn', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 4. Insert Uzbek (3)
    FOR i IN 1..3 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'uz_dummy_' || i || '@gachon.ac.kr';
        -- Plausible balance between 80,000 KRW and 2,500,000 KRW
        dummy_balance := floor(random() * 2420000 + 80000);
        
        -- Insert into auth.users
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || uz_nicknames[i]);
        
        -- Insert into public.leaderboard
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;

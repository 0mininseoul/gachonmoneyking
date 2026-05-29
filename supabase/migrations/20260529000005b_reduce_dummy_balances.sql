-- 1. Delete all existing dummy records first
delete from public.leaderboard where is_dummy = true;
delete from public.profiles where is_dummy = true;
delete from auth.users where id not in (
  'f1e0801d-49d5-4197-bf51-8b0512b24a48', -- Minh Anh (vietnamese)
  '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d'  -- Tuan (vietnamese)
);

-- 2. Insert 44 dummy users (24 Vietnamese, 3 Japanese, 12 Chinese, 2 Mongolian, 3 Uzbek)
DO $$
DECLARE
    new_uid uuid;
    i integer;
    
    -- Vietnamese (24)
    vn_nicknames text[] := array['Linh Dễ Thương', 'Huy Gachon', 'Nam Bún Chả', 'Thảo Pink', 'Dũng Kun', 'Giang Cười', 'Hồng Sơn', 'Mai Quả Mọng', 'Quỳnh Nhỏ', 'Long Vina', 'Vy Vy', 'Hiếu Kaka', 'Trang Trang', 'Tùng Tùng', 'Phương Hana', 'Lan Vina', 'Khoa Gachon', 'Minh Đầu Bếp', 'Bình Nguyễn', 'Duy Duy', 'Khang Khang', 'Anh Anh', 'Oanh Oanh', 'Việt Việt'];
    vn_realnames text[] := array['Le Minh Anh', 'Pham Thuy Linh', 'Le Thi Huong', 'Phan Gia Huy', 'Vu Hoai Nam', 'Dang Thanh Phong', 'Bui Minh Thao', 'Do Tien Dung', 'Ho Thanh Hai', 'Ngo Thu Giang', 'Duong Hong Son', 'Nguyen Thanh Mai', 'Tran Nhu Quynh', 'Pham Hoang Long', 'Le Khanh Vy', 'Hoang Trung Hieu', 'Phan Huyen Trang', 'Vu Thanh Tung', 'Dang Minh Phuong', 'Bui Thi Lan', 'Do Anh Khoa', 'Ho Ngoc Minh', 'Ngo Thanh Binh', 'Duong Quoc Duy'];
    
    -- Japanese (3)
    ja_nicknames text[] := array['ケント', 'ゆかさとう', 'はる'];
    ja_realnames text[] := array['Kento Sato', 'Yuka Tanaka', 'Haruto Watanabe'];
    
    -- Chinese (12)
    zh_nicknames text[] := array['小王', '嘉泉熊猫', '晶晶', '宇宇', '林林', '阿信', '默默', '小吴', '洋洋', '昭昭', '徐徐', '孙孙'];
    zh_realnames text[] := array['Zhang Wei', 'Wang Jing', 'Li Min', 'Chen Yu', 'Liu Yan', 'Yang Jun', 'Huang Lin', 'Zhao Xin', 'Wu Hao', 'Zhou Ping', 'Xu Fan', 'Sun Lei'];
    
    -- Mongolian (2)
    mn_nicknames text[] := array['Тэмүү', 'Хулан'];
    mn_realnames text[] := array['Temulen Bat-Erdene', 'Khulan Altangerel'];
    
    -- Uzbek (3)
    uz_nicknames text[] := array['Anvarbek', 'Dilshod', 'Jasurbek'];
    uz_realnames text[] := array['Anvar Soliev', 'Dilshod Karimov', 'Jasur Akhmedov'];
    
    dummy_email text;
    dummy_balance numeric;
BEGIN
    -- 1. Insert Vietnamese (24)
    FOR i IN 1..24 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        
        -- Plausible balance: 50% low (<200k), 35% mid (200k-1M), 15% high (1M-3.5M)
        if i <= 12 then
            dummy_balance := floor(random() * 195000 + 5000); -- 5,000 to 200,000
        elsif i <= 20 then
            dummy_balance := floor(random() * 700000 + 200000); -- 200,000 to 900,000
        else
            dummy_balance := floor(random() * 2500000 + 1000000); -- 1,000,000 to 3,500,000
        end if;
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, vn_nicknames[i], 'vi', vn_realnames[i], '010-0000-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || vn_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, vn_nicknames[i], 'vi', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 2. Insert Japanese (3)
    FOR i IN 1..3 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'ja_dummy_' || i || '@gachon.ac.kr';
        
        -- Plausible balance: 1 low, 1 mid, 1 high
        if i = 1 then
            dummy_balance := floor(random() * 250000 + 50000); -- 50,000 to 300,000
        elsif i = 2 then
            dummy_balance := floor(random() * 600000 + 300000); -- 300,000 to 900,000
        else
            dummy_balance := floor(random() * 3000000 + 1000000); -- 1,000,000 to 4,000,000
        end if;
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, ja_nicknames[i], 'ja', ja_realnames[i], '010-4444-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || ja_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, ja_nicknames[i], 'ja', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 3. Insert Chinese (12)
    FOR i IN 1..12 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'zh_dummy_' || i || '@gachon.ac.kr';
        
        -- Plausible balance: 50% low, 33% mid, 17% high
        if i <= 6 then
            dummy_balance := floor(random() * 350000 + 50000); -- 50,000 to 400,000
        elsif i <= 10 then
            dummy_balance := floor(random() * 800000 + 400000); -- 400,000 to 1,200,000
        else
            dummy_balance := floor(random() * 3500000 + 1500000); -- 1,500,000 to 5,000,000
        end if;
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, zh_nicknames[i], 'zh', zh_realnames[i], '010-1111-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || zh_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, zh_nicknames[i], 'zh', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 4. Insert Mongolian (2)
    FOR i IN 1..2 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'mn_dummy_' || i || '@gachon.ac.kr';
        
        -- Plausible balance: 1 low, 1 mid
        if i = 1 then
            dummy_balance := floor(random() * 140000 + 10000); -- 10,000 to 150,000
        else
            dummy_balance := floor(random() * 600000 + 200000); -- 200,000 to 800,000
        end if;
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, mn_nicknames[i], 'mn', mn_realnames[i], '010-2222-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || mn_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, mn_nicknames[i], 'mn', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 5. Insert Uzbek (3)
    FOR i IN 1..3 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'uz_dummy_' || i || '@gachon.ac.kr';
        
        -- Plausible balance: 2 low, 1 mid/high
        if i <= 2 then
            dummy_balance := floor(random() * 290000 + 10000); -- 10,000 to 300,000
        else
            dummy_balance := floor(random() * 1000000 + 500000); -- 500,000 to 1,500,000
        end if;
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || uz_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;

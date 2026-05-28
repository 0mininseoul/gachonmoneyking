-- Delete all existing dummy records first
delete from public.leaderboard where is_dummy = true;
delete from public.profiles where is_dummy = true;
delete from auth.users where id not in (
  'f1e0801d-49d5-4197-bf51-8b0512b24a48', -- Minh Anh (vietnamese)
  '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d'  -- Tuan (vietnamese)
);

-- Insert exactly 16 dummy users with highly realistic student balances
-- Most are below 1,000,000 KRW (mostly between 5,000 and 800,000 KRW)
-- Only top-tier users cross 1,000,000 KRW.
DO $$
DECLARE
    new_uid uuid;
    i integer;
    
    -- Vietnamese (7)
    vn_nicknames text[] := array[
      'thích_ăn_phở', 'sinh_viên_nghèo', 'thèm_bún_chả', 
      'cày_deadline', 'chúa_tể_tiết_kiệm', 'bánh_mì_que', 'đi_làm_thêm'
    ];
    vn_realnames text[] := array[
      'Le Minh Anh', 'Pham Thuy Linh', 'Le Thi Huong', 
      'Phan Gia Huy', 'Vu Hoai Nam', 'Dang Thanh Phong', 'Bui Minh Thao'
    ];
    vn_balances numeric[] := array[
      154200, -- 154,200 KRW
      34500,  -- 34,500 KRW
      640000, -- 640,000 KRW
      87000,  -- 87,000 KRW
      852000, -- 852,000 KRW
      12300,  -- 12,300 KRW
      1120000 -- 1,120,000 KRW (top tier)
    ];
    
    -- Japanese (1)
    ja_nicknames text[] := array['課題終わらん'];
    ja_realnames text[] := array['Kento Sato'];
    ja_balances numeric[] := array[450000]; -- 450,000 KRW
    
    -- Chinese (5)
    zh_nicknames text[] := array[
      '不爱吃泡菜', '熬夜冠军', '论文写不完', '早八受害者', '加川摸鱼王'
    ];
    zh_realnames text[] := array[
      'Zhang Wei', 'Wang Jing', 'Li Min', 'Chen Yu', 'Liu Yan'
    ];
    zh_balances numeric[] := array[
      125000,  -- 125,000 KRW
      45000,   -- 45,000 KRW
      720000,  -- 720,000 KRW
      980000,  -- 980,000 KRW
      1350000  -- 1,350,000 KRW (top tier)
    ];
    
    -- Mongolian (2)
    mn_nicknames text[] := array['гачон_оюутан', 'бууз_идье'];
    mn_realnames text[] := array['Temulen Bat-Erdene', 'Khulan Altangerel'];
    mn_balances numeric[] := array[
      88000,  -- 88,000 KRW
      245000  -- 245,000 KRW
    ];
    
    -- Uzbek (1)
    uz_nicknames text[] := array['osh_plov'];
    uz_realnames text[] := array['Anvar Soliev'];
    uz_balances numeric[] := array[180000]; -- 180,000 KRW
    
    dummy_email text;
    dummy_balance numeric;
BEGIN
    -- 1. Insert Vietnamese (7)
    FOR i IN 1..7 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        dummy_balance := vn_balances[i];
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, vn_nicknames[i], 'vi', vn_realnames[i], '010-0000-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || vn_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, vn_nicknames[i], 'vi', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 2. Insert Japanese (1)
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'ja_dummy_' || i || '@gachon.ac.kr';
        dummy_balance := ja_balances[i];
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, ja_nicknames[i], 'ja', ja_realnames[i], '010-4444-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || ja_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, ja_nicknames[i], 'ja', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 3. Insert Chinese (5)
    FOR i IN 1..5 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'zh_dummy_' || i || '@gachon.ac.kr';
        dummy_balance := zh_balances[i];
        
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
        dummy_balance := mn_balances[i];
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, mn_nicknames[i], 'mn', mn_realnames[i], '010-2222-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || mn_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, mn_nicknames[i], 'mn', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;

    -- 5. Insert Uzbek (1)
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'uz_dummy_' || i || '@gachon.ac.kr';
        dummy_balance := uz_balances[i];
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || uz_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;

-- Diversify dummy nickname registers so the seed leaderboard reads as organic
-- (mix of plain handles, name-style, numbers, and a few low-effort entries),
-- instead of uniformly witty student puns.
delete from public.leaderboard where is_dummy = true;
delete from public.profiles where is_dummy = true;
delete from auth.users where id not in (
  'f1e0801d-49d5-4197-bf51-8b0512b24a48', -- Minh Anh (vietnamese)
  '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d'  -- Tuan (vietnamese)
);

DO $$
DECLARE
    new_uid uuid; i integer; dummy_email text; dummy_balance numeric;
    -- Mixed registers: real-name-ish, plain handle, number suffix, one witty, one lazy
    vn_nicknames text[] := array['minh.0902','pholuon','ng_anh','huy2001','tiếtkiệm','an','tran_99'];
    vn_realnames text[] := array['Le Minh Anh','Pham Thuy Linh','Le Thi Huong','Phan Gia Huy','Vu Hoai Nam','Dang Thanh Phong','Bui Minh Thao'];
    ja_nicknames text[] := array['yuka_t'];
    ja_realnames text[] := array['Yuka Tanaka'];
    zh_nicknames text[] := array['xiaowang','limin_3','陈yu','zhao1998','加川'];
    zh_realnames text[] := array['Wang Jing','Li Min','Chen Yu','Zhao Xin','Liu Yan'];
    mn_nicknames text[] := array['temka','khulan_0'];
    mn_realnames text[] := array['Temulen Bat-Erdene','Khulan Altangerel'];
    uz_nicknames text[] := array['anvar_s'];
    uz_realnames text[] := array['Anvar Soliev'];
BEGIN
    FOR i IN 1..7 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        if i <= 5 then dummy_balance := floor(random() * 2900000 + 100000); else dummy_balance := floor(random() * 3000000 + 3000000); end if;
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, vn_nicknames[i], 'vi', vn_realnames[i], '010-0000-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, vn_nicknames[i], 'vi', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'ja_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 4200000 + 300000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, ja_nicknames[i], 'ja', ja_realnames[i], '010-4444-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, ja_nicknames[i], 'ja', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..5 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'zh_dummy_' || i || '@gachon.ac.kr';
        if i <= 3 then dummy_balance := floor(random() * 4500000 + 500000); else dummy_balance := floor(random() * 3000000 + 5000000); end if;
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, zh_nicknames[i], 'zh', zh_realnames[i], '010-1111-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, zh_nicknames[i], 'zh', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..2 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'mn_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 3900000 + 100000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, mn_nicknames[i], 'mn', mn_realnames[i], '010-2222-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, mn_nicknames[i], 'mn', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
    FOR i IN 1..1 LOOP
        new_uid := gen_random_uuid(); dummy_email := 'uz_dummy_' || i || '@gachon.ac.kr'; dummy_balance := floor(random() * 4350000 + 150000);
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i,'FM00'), 'unknown', true, true, dummy_email, '');
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;

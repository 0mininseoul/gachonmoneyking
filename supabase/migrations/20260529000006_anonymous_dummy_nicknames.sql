-- Delete all existing dummy records first
delete from public.leaderboard where is_dummy = true;
delete from public.profiles where is_dummy = true;
delete from auth.users where id not in (
  'f1e0801d-49d5-4197-bf51-8b0512b24a48', -- Minh Anh (vietnamese)
  '67a0417d-69ba-4b5d-9f8a-2c5c44e8a16d'  -- Tuan (vietnamese)
);

-- Insert 44 dummy users with highly realistic anonymous nicknames (24 Vietnamese, 3 Japanese, 12 Chinese, 2 Mongolian, 3 Uzbek)
DO $$
DECLARE
    new_uid uuid;
    i integer;
    
    -- Vietnamese (24)
    vn_nicknames text[] := array[
      'thich_an_pho', 'sinh_vien_ngheo', 'them_bun_cha', 'cay_deadline', 
      'gachon_boy', 'gachon_girl', 'di_lam_them', 'com_tam_via_he', 
      'hoc_tieng_han', 'me_tra_sua', 'chua_te_tiet_kiem', 'banh_mi_que', 
      'kimbap_ngon', 'kho_qua_di', 'phat_tai_di', 'ca_phe_sua_da', 
      'do_an_kho', 'an_va_ngu', 'cuoc_song_kr', 'nem_ran_gion', 
      'tro_troi_oi', 'mon_an_han', 'di_hoc_muon', 'cuoi_len_di'
    ];
    vn_realnames text[] := array[
      'Le Minh Anh', 'Pham Thuy Linh', 'Le Thi Huong', 'Phan Gia Huy', 
      'Vu Hoai Nam', 'Dang Thanh Phong', 'Bui Minh Thao', 'Do Tien Dung', 
      'Ho Thanh Hai', 'Ngo Thu Giang', 'Duong Hong Son', 'Nguyen Thanh Mai', 
      'Tran Nhu Quynh', 'Pham Hoang Long', 'Le Khanh Vy', 'Hoang Trung Hieu', 
      'Phan Huyen Trang', 'Vu Thanh Tung', 'Dang Minh Phuong', 'Bui Thi Lan', 
      'Do Anh Khoa', 'Ho Ngoc Minh', 'Ngo Thanh Binh', 'Duong Quoc Duy'
    ];
    
    -- Japanese (3)
    ja_nicknames text[] := array['kadai_owaran', 'iced_americano', 'kimchi_suki'];
    ja_realnames text[] := array['Kento Sato', 'Yuka Tanaka', 'Haruto Watanabe'];
    
    -- Chinese (12)
    zh_nicknames text[] := array[
      '不爱吃泡菜', '熬夜冠军', '嘉泉大学着', '论文写不完', 
      '早八受害者', '首尔打工人', '想吃海底捞', '冰美式代入', 
      '秃头小宝贝', '在韩吃货', '红薯小助手', '加川摸鱼王'
    ];
    zh_realnames text[] := array[
      'Zhang Wei', 'Wang Jing', 'Li Min', 'Chen Yu', 
      'Liu Yan', 'Yang Jun', 'Huang Lin', 'Zhao Xin', 
      'Wu Hao', 'Zhou Ping', 'Xu Fan', 'Sun Lei'
    ];
    
    -- Mongolian (2)
    mn_nicknames text[] := array['gachon_oyutan', 'buuz_idiy'];
    mn_realnames text[] := array['Temulen Bat-Erdene', 'Khulan Altangerel'];
    
    -- Uzbek (3)
    uz_nicknames text[] := array['osh_plov', 'gachon_talaba', 'somsa_patir'];
    uz_realnames text[] := array['Anvar Soliev', 'Dilshod Karimov', 'Jasur Akhmedov'];
    
    dummy_email text;
    dummy_balance numeric;
BEGIN
    -- 1. Insert Vietnamese (24)
    FOR i IN 1..24 LOOP
        new_uid := gen_random_uuid();
        dummy_email := 'vn_dummy_' || i || '@gachon.ac.kr';
        -- Plausible balance between 100,000 KRW and 6,000,000 KRW
        if i <= 20 then
            dummy_balance := floor(random() * 2900000 + 100000);
        else
            dummy_balance := floor(random() * 3000000 + 3000000);
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
        -- Plausible balance between 300,000 KRW and 4,500,000 KRW
        dummy_balance := floor(random() * 4200000 + 300000);
        
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
        -- Plausible balance between 500,000 KRW and 8,000,000 KRW
        if i <= 8 then
            dummy_balance := floor(random() * 4500000 + 500000);
        else
            dummy_balance := floor(random() * 3000000 + 5000000);
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
        -- Plausible balance between 100,000 KRW and 4,000,000 KRW
        dummy_balance := floor(random() * 3900000 + 100000);
        
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
        -- Plausible balance between 150,000 KRW and 4,500,000 KRW
        dummy_balance := floor(random() * 4350000 + 150000);
        
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
        VALUES (new_uid, dummy_email, '$2a$10$abcdefghijklmnopqrstuv', now(), '{"provider":"kakao"}', '{}', 'authenticated', 'authenticated', now(), now());
        
        INSERT INTO public.profiles (id, nickname, nationality, real_name, phone_number, gender, marketing_consent, is_dummy, email, avatar_url)
        VALUES (new_uid, uz_nicknames[i], 'uz', uz_realnames[i], '010-3333-00' || to_char(i, 'FM00'), 'unknown', true, true, dummy_email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || uz_nicknames[i]);
        
        INSERT INTO public.leaderboard (user_id, nickname, nationality, balance, screenshot_url, status, is_dummy, updated_at)
        VALUES (new_uid, uz_nicknames[i], 'uz', dummy_balance, 'https://example.com/screenshots/dummy.png', 'verified', true, now());
    END LOOP;
END $$;

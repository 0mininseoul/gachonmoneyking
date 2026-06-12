-- Rebalance seed-only dummy users to realistic student bank balances.
-- All values stay below 1,000,000 KRW; real verified users are untouched.
with realistic_dummy_balances(email, balance) as (
  values
    ('vn_dummy_1@gachon.ac.kr', 154200),
    ('vn_dummy_2@gachon.ac.kr', 34500),
    ('vn_dummy_3@gachon.ac.kr', 412000),
    ('vn_dummy_4@gachon.ac.kr', 87000),
    ('vn_dummy_5@gachon.ac.kr', 682000),
    ('vn_dummy_6@gachon.ac.kr', 12300),
    ('vn_dummy_7@gachon.ac.kr', 735000),
    ('ja_dummy_1@gachon.ac.kr', 450000),
    ('zh_dummy_1@gachon.ac.kr', 125000),
    ('zh_dummy_2@gachon.ac.kr', 45000),
    ('zh_dummy_3@gachon.ac.kr', 520000),
    ('zh_dummy_4@gachon.ac.kr', 760000),
    ('zh_dummy_5@gachon.ac.kr', 920000),
    ('mn_dummy_1@gachon.ac.kr', 88000),
    ('mn_dummy_2@gachon.ac.kr', 245000),
    ('uz_dummy_1@gachon.ac.kr', 180000)
)
update public.leaderboard as l
set balance = r.balance,
    updated_at = now()
from public.profiles as p
join realistic_dummy_balances as r
  on r.email = p.email
where l.user_id = p.id
  and l.is_dummy = true
  and p.is_dummy = true;

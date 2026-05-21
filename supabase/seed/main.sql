-- This is just for testing - in real app, users are created via auth.signUp()
INSERT INTO auth.users
  (email, id, is_super_admin, is_anonymous, is_sso_user, aud, role, raw_user_meta_data, raw_app_meta_data, encrypted_password, created_at, updated_at, email_confirmed_at, last_sign_in_at, instance_id, confirmation_sent_at, invited_at, confirmation_token, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, deleted_at)
VALUES
  -- dev@blendalabs.com, password "video"
  (E'dev@blendalabs.com',E'813b6b64-f5f4-49ea-9719-c49db026d937',NULL,FALSE,FALSE,E'authenticated',E'authenticated',E'{"sub": "813b6b64-f5f4-49ea-9719-c49db026d937", "email": "dev@blendalabs.com", "email_verified": true, "phone_verified": false}',E'{"provider": "email", "providers": ["email"]}',E'$2a$10$tYPLDSt6W4YTjBXO.BKDbOtNx0J2A/QvQe8el4diKxyg3ccahuJzO',E'2024-07-26 10:53:53.692529+00',E'2025-06-10 09:42:18.278578+00',E'2024-07-26 10:52:08.259926+00',E'2025-06-10 09:42:18.276055+00',E'00000000-0000-0000-0000-000000000000',NULL,NULL,E'',E'',NULL,E'',E'',NULL,NULL,NULL,E'',E'',NULL,E'',0,NULL,E'',NULL,NULL);

-- User Profiles
INSERT INTO public.user_profiles
  (id, full_name, avatar_url, created_at, updated_at)
VALUES
  (E'813b6b64-f5f4-49ea-9719-c49db026d937', E'Dev User', NULL, E'2024-07-26 10:53:53.692529+00', E'2024-07-26 10:53:53.692529+00');

-- Teams
INSERT INTO public.teams
  (id, name, slug, description, creator_user_id, created_at, updated_at)
VALUES
  (E'5e44edd3-df5d-4ff1-84f4-0ca7d7ba1704',E'Blenda Labs',E'blendalabs',NULL,E'813b6b64-f5f4-49ea-9719-c49db026d937',E'2025-09-18 11:25:01.685084+00',E'2025-09-18 11:25:01.685084+00');

-- Team Members
INSERT INTO public.team_members
  (id, team_id, user_id, role, joined_at)
VALUES
  (E'6f55fdd4-ef6e-4ff2-95f5-1db8e8cb2815', E'5e44edd3-df5d-4ff1-84f4-0ca7d7ba1704', E'813b6b64-f5f4-49ea-9719-c49db026d937', E'admin', E'2025-09-18 11:25:01.685084+00');

-- Templates
INSERT INTO public.templates
  (id, title, description, team_id, creator_user_id, thumbnail_url, duration, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Video Template 1', 'Example product video', '5e44edd3-df5d-4ff1-84f4-0ca7d7ba1704', '813b6b64-f5f4-49ea-9719-c49db026d937', '/video_placeholder.svg', 12110, NOW(), NOW());

-- Brands
INSERT INTO public.brands
  (id, team_id, name, slug, logo_url, created_at, updated_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '5e44edd3-df5d-4ff1-84f4-0ca7d7ba1704', 'Vio Ljusfabrik', 'vio-ljusfabrik', NULL, NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440002', '5e44edd3-df5d-4ff1-84f4-0ca7d7ba1704', 'Nordic Coffee', 'nordic-coffee', NULL, NOW(), NOW());

UPDATE public.templates
SET brand_id = '770e8400-e29b-41d4-a716-446655440001'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- template locales
INSERT INTO public.template_locales
  (id, template_id, locale, last_render_url, thumbnail_url, created_at, updated_at)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'en', NULL, '/product-launch-thumbnail.png', NOW(), NOW());

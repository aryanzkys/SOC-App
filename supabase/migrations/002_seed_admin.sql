insert into users (nisn, token_hash, is_admin, name)
values ('admin12345', '$2b$10$KZBgxa/wSA/RRoV/kedyAujGqcXanOpT71RSrCXkXpkbsCzcdmzWm', true, 'Administrator')
on conflict (nisn) do nothing;

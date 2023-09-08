-- user additions
-- plaintext password: superlongpassword
INSERT INTO users(username, password) VALUES ('galenlong', '$argon2id$v=19$m=65536,t=3,p=4$2oUJX7PNCL/BxFJdYbS6fw$tfZPSy55YbVAcKq3+wbKkl278a+Hp8+xkLr+eivCjqA');

-- plaintext password: littleredbook
INSERT INTO users(username, password) VALUES ('lupefn', '$argon2id$v=19$m=65536,t=3,p=4$XAb8rPVo/H7Wq65c8mXrQA$39OYJWjnEXk/bNLHeJ4qBQHfvwhi5g5LU3Ab3A6W/VU');


-- author additions
INSERT INTO authors(id, name, bio, user) VALUES ('41eaa6bb-3146-4b40-827f-e42aded02626', 'Vincent Bevins', 'American journalist and writer', 'galenlong');

INSERT INTO authors(id, name, bio, user) VALUES ('cc4f25a6-473b-4a27-96bd-5cf807f368da', 'Vijay Prashad', 'Indian Marxist historian and commentator', 'lupefn');

INSERT INTO authors(id, name, bio, user) VALUES ('32fac1e4-0912-4291-acec-c323f73a914e', 'Assata Shakur', 'American political activist', 'lupefn');

INSERT INTO authors(id, name, bio, user) VALUES ('02448972-51ab-49e4-aa00-b672aa0ddd62', 'Suzanne Collins', 'American author and screenwriter', 'galenlong');


-- book additions
INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES ('6dc580cb-02c0-4165-9301-94a54ecb4cc9', '41eaa6bb-3146-4b40-827f-e42aded02626', 'The Jakarta Method', 2020, 'history-and-politics', 'lupefn');

INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES ('f172f545-da76-4039-8bbc-32ff7beb8a12', 'cc4f25a6-473b-4a27-96bd-5cf807f368da', "Washington's Bullets", 2020, 'history-and-politics', 'galenlong');

INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES ('fc6fe690-3cd7-4e54-b4f7-c904ded59694', '32fac1e4-0912-4291-acec-c323f73a914e', 'Assata: An Autobiography', 1988, 'biography-memoir', 'lupefn');

INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES ('2da02a12-1b6d-4c18-9725-adc8c1e6c364', '02448972-51ab-49e4-aa00-b672aa0ddd62', 'The Hunger Games', 2008, 'adolescence', 'galenlong');

INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES ('296a1955-72ee-4702-abbc-e86b7e42a6ee', 'cc4f25a6-473b-4a27-96bd-5cf807f368da', 'Red Star Over the Third World', 2017, 'history-and-politics', 'lupefn');


CREATE DATABASE IF NOT EXISTS imcdb;

USE imcdb;

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    idade INT NOT NULL,
    peso FLOAT NOT NULL,
    altura FLOAT NOT NULL,
    sexo VARCHAR(10) NOT NULL,
    imc FLOAT NOT NULL,
    tmb FLOAT NOT NULL
);

ALTER USER 'usuario'@'%' IDENTIFIED WITH caching_sha2_password BY 'senhausuario';

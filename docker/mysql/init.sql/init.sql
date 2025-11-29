CREATE DATABASE IF NOT EXISTS breakappdb;

USE breakappdb;

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    idade INT,
    peso FLOAT,
    altura FLOAT,
    sexo ENUM('masculino', 'feminino'),
    imc FLOAT,
    tmb FLOAT
);


ALTER USER 'usuario'@'%' IDENTIFIED WITH caching_sha2_password BY 'senhausuario';

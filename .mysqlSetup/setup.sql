CREATE DATABASE chat;
CREATE TABLE `chat`.`messages` 
( 
  `message_id` INT NOT NULL AUTO_INCREMENT , 
  `content` LONGTEXT NOT NULL ,
  `chat_id` TEXT NOT NULL ,
  `encryptionType` TEXT NOT NULL ,
  `timestamp` TIMESTAMP(5) NOT NULL DEFAULT CURRENT_TIMESTAMP(5) , 
  PRIMARY KEY (`message_id`)
) ENGINE = InnoDB;

CREATE TABLE `chat`.`users` 
( 
    `username` TEXT NOT NULL , 
    `profilePicture` LONGTEXT NULL DEFAULT NULL ,
    `password` TEXT NOT NULL , 
    `publicKey` TEXT NOT NULL ,
    `privateKey` TEXT NOT NULL ,
    `chatKeysInbox` JSON NOT NULL ,
    `chatKeys` LONGTEXT NULL ,
  PRIMARY KEY (`username`(256))
) ENGINE = InnoDB;

CREATE TABLE `chat`.`authorisation` 
( 
  `id` INT NOT NULL AUTO_INCREMENT , 
  `username` TEXT NOT NULL ,
  `token` TEXT NOT NULL , 
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , 
  `expires` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,  
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE `chat`.`licences` 
( 
    `code` VARCHAR(9) NOT NULL , 
    `used` BOOLEAN NOT NULL DEFAULT FALSE , 
    `username` TEXT NULL ,
    PRIMARY KEY (`code`)
) ENGINE = InnoDB;

/*Table structure for table `zz__yashi_cgn` */

CREATE TABLE IF NOT EXISTS `zz__yashi_cgn` (
  `campaign_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `yashi_campaign_id` INT(11) UNSIGNED DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `yashi_advertiser_id` INT(11) UNSIGNED DEFAULT NULL,
  `advertiser_name` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`campaign_id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8;

/*Table structure for table `zz__yashi_cgn_data` */

CREATE TABLE IF NOT EXISTS`zz__yashi_cgn_data` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `campaign_id` INT(11) UNSIGNED DEFAULT NULL,
  `log_date` INT(11) DEFAULT NULL,
  `impression_count` INT(11) DEFAULT NULL,
  `click_count` INT(11) DEFAULT NULL,
  `25viewed_count` INT(11) DEFAULT NULL,
  `50viewed_count` INT(11) DEFAULT NULL,
  `75viewed_count` INT(11) DEFAULT NULL,
  `100viewed_count` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaign_id_UNIQUE` (`campaign_id`,`log_date`),
  KEY `fk_zz__yashi_cgn_data_campaign_id_idx` (`campaign_id`),
  CONSTRAINT `fk_zz__yashi_cgn_campaign_id` FOREIGN KEY (`campaign_id`) REFERENCES `zz__yashi_cgn` (`campaign_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=INNODB DEFAULT CHARSET=utf8;


/*Table structure for table `zz__yashi_order` */

CREATE TABLE IF NOT EXISTS`zz__yashi_order` (
  `order_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` INT(11) UNSIGNED DEFAULT NULL,
  `yashi_order_id` INT(20) DEFAULT NULL,
  `name` VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_zz__yashi_order_campaign_id_idx` (`campaign_id`),
  CONSTRAINT `fk_zz__yashi_order_campaign_id` FOREIGN KEY (`campaign_id`) REFERENCES `zz__yashi_cgn` (`campaign_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=INNODB DEFAULT CHARSET=utf8;

/*Table structure for table `zz__yashi_order_data` */

CREATE TABLE IF NOT EXISTS`zz__yashi_order_data` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) UNSIGNED DEFAULT NULL,
  `log_date` INT(11) DEFAULT NULL,
  `impression_count` INT(11) DEFAULT NULL,
  `click_count` INT(11) DEFAULT NULL,
  `25viewed_count` INT(11) DEFAULT NULL,
  `50viewed_count` INT(11) DEFAULT NULL,
  `75viewed_count` INT(11) DEFAULT NULL,
  `100viewed_count` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`,`log_date`),
  KEY `fk_zz__yashi_order_data_order_id_idx` (`order_id`),
  CONSTRAINT `fk_zz__yashi_order_data_order_id` FOREIGN KEY (`order_id`) REFERENCES `zz__yashi_order` (`order_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=INNODB DEFAULT CHARSET=utf8;


/*Table structure for table `zz__yashi_creative` */

CREATE TABLE IF NOT EXISTS`zz__yashi_creative` (
  `creative_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) UNSIGNED DEFAULT NULL,
  `yashi_creative_id` INT(11) DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `preview_url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`creative_id`),
  KEY `fk_zz__yashi_creative_order_id_idx` (`order_id`),
  CONSTRAINT `fk_zz__yashi_creative_order_id` FOREIGN KEY (`order_id`) REFERENCES `zz__yashi_order` (`order_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=INNODB DEFAULT CHARSET=utf8;

/*Table structure for table `zz__yashi_creative_data` */

CREATE TABLE IF NOT EXISTS`zz__yashi_creative_data` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `creative_id` INT(11) UNSIGNED DEFAULT NULL,
  `log_date` INT(11) DEFAULT NULL,
  `impression_count` INT(11) DEFAULT NULL,
  `click_count` INT(11) DEFAULT NULL,
  `25viewed_count` INT(11) DEFAULT NULL,
  `50viewed_count` INT(11) DEFAULT NULL,
  `75viewed_count` INT(11) DEFAULT NULL,
  `100viewed_count` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `creative_id_UNIQUE` (`creative_id`,`log_date`),
  KEY `fk_zz__yashi_creative_data_creative_id_idx` (`creative_id`),
  CONSTRAINT `fk_zz__yashi_creative_data_creative_id` FOREIGN KEY (`creative_id`) REFERENCES `zz__yashi_creative` (`creative_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=INNODB DEFAULT CHARSET=utf8;

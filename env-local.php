<?php

/**
 *
 * APP SERVER SPECIFIC SETTINGS / CONFIG
 *   - Add this file to ".gitignore"!
 *
 */

define('__DEBUG__', true);
define('__ENV_PROD__', false);


$app->uriBase = '/';
$app->defaultHost = '//happy.localhost';
$app->rootPath = 'C:/Laragon/www/happy';
$app->timezone = 'Africa/Johannesburg';


$app->dbConnection = [
  'DBHOST' => 'localhost',
  'DBNAME' => 'happy_db',
  'DBUSER' => 'root',
  'DBPASS' => 'root'
];


$app->email             = new stdClass();
$app->email->smtp       = 'mail.happy.co.za';
$app->email->user       = 'user@happy.co.za';
$app->email->pass       = 'pw4Happy';
$app->email->port       = '587';
$app->email->encryption = 'tls';
$app->email->SMTPAuth   = 'true';
$app->email->from       = 'no-reply@happy.co.za';
$app->email->fromname   = 'Happy JS Demo';
$app->email->replyto    = 'user@happy.co.za';
$app->email->replyname  = 'Happy JS Demo';
$app->email->bcc1       = 'webadmin@happy.co.za';
$app->email->bcc1name   = 'Webadmin';
$app->email->bcc2       = 'manager@happy.co.za';
$app->email->bcc2name   = 'Manager';


$app->auth = new stdClass();
$app->auth->loggedIn = false;
$app->auth->username = 'admin';
$app->auth->password = 'admin';

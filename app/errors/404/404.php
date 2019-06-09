<?php

  $page = new stdClass();
  $page->title = 'Error 404 (Page Not Found)';
  $page->dir = $app->controllerPath;
  $page->id = 'page_' . $app->currentPage;
  $page->state = $app->session->get($page->id, []);
  $page->errors = $app->session->get('errors', []);
  $page->alerts = $app->session->get('alerts', []);
  $page->lastCsrfToken = $app->session->get('csrfToken');
  $page->basename = substr(__FILE__, 0, strlen(__FILE__)-4);
  $page->viewFilePath = $page->basename . '.html';
  $page->csrfToken = md5(uniqid(rand(), true)); //time();

  $app->page = $page;


  // ----------------------
  // -------- POST --------
  // ----------------------
  if ($request->method == 'POST')
  {
    do {

      $errors = [];
      $alerts = [];

      $request->action = array_get($_POST, '__ACTION__');
      $request->params = array_get($_POST, '__PARAMS__');

      $alerts[] = ['info', 'Hey, you posted some data.', 3000];

    } while (0);

    $page->state['errors'] = $errors;
    $page->state['alerts'] = $alerts;
    $app->state[$page->id] = $page->state;
    $response->redirectTo = $request->back ?: $request->uri;
  }


  // ----------------------
  // -------- GET ---------
  // ----------------------
  else {

    include $app->partialsPath . '/head.html';
    include $view->partialFile($app->page->dir, $app->page->viewFilePath, 'html', 3, null, '        ');
    include $app->partialsPath . '/foot.html';

    // Save the APP-STATE before we exit.
    $app->session->flash('csrfToken', $page->csrfToken);
    $app->session->put($page->id, $page->state);
  }

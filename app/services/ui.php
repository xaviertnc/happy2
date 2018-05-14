<?php

class UiClass {

  public $app;


  public function __construct($app)
  {
    $this->app = $app;
  }


  public function e($str)
  {
    if (is_string($str)) {
      return htmlspecialchars($str, ENT_QUOTES | ENT_IGNORE, "UTF-8", false);
    }
  }


  public function indent($n, $dent = null)
  {
    return $n ? str_repeat($dent?:"\t", $n) : '';
  }


  public function indentBlock($text, $indent)
  {
    return implode("\n" . $indent, explode("\n", trim($text)));
  }


  public function menuItem($url, $label = null) {
    return '<li' . ($this->app->request->pageref == $url ? ' class="active">' : '>') .
      '<a href="' . $url . '" class="pagelink">' . ($label ?: $url) . '</a></li>' . PHP_EOL;
  }


  public function styles()
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/style.css';
    if ( ! file_exists($filePath)) { return; }
    $timestamp = filemtime($filePath);
    $cacheFilePath = "$pagePath/cache/$timestamp.css";
    if (file_exists($cacheFilePath)) { return file_get_contents($cacheFilePath); }
    $tabspace = '  ';
    $indent = $this->indent(2, $tabspace);
    $stylesContent = file_get_contents($filePath);
    $stylesContent = $this->indentBlock($stylesContent, $indent . $tabspace);
    $html  = '<style data-rel="page">' . PHP_EOL;
    $html .= $indent . $tabspace . $stylesContent . PHP_EOL;
    $html .= $indent . '</style>' . PHP_EOL;
    $cachePath = $pagePath . '/cache';
    if ( ! is_dir($cachePath)) { mkdir($cachePath); }
    file_put_contents($cacheFilePath, $html);
    return $html;
  }


  public function alerts()
  {
    $tabspace = '  ';
    $indent = $this->indent(3, $tabspace);
    $alerts = $this->app->page->alerts;
    $html  = '<div id="alerts">';
    if ( ! $alerts) { return $html . '</div>' . PHP_EOL; }
    else { $html .= PHP_EOL; }
    foreach($alerts as $alert)
    {
      $html .= $indent . $tabspace;
      $html .= '<div class="alert ' . $alert[0] . '" data-ttl="' . $alert[2] . '">' . $alert[1] . '</div>';
      $html .= PHP_EOL;
    }
    $html .= $indent . '</div>' . PHP_EOL;
    return $html;
  }


  public function script()
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/script.js';
    if ( ! file_exists($filePath)) { return; }
    $timestamp = filemtime($filePath);
    $cacheFilePath = "$pagePath/cache/$timestamp.js";
    if (file_exists($cacheFilePath)) { return file_get_contents($cacheFilePath); }
    $tabspace = '  ';
    $indent = $this->indent(4, $tabspace);
    $scriptContent = file_get_contents($filePath);
    $scriptContent = $this->indentBlock($scriptContent, $indent . $tabspace);
    $html  = '<script>' . PHP_EOL;
    $html .= $indent . $tabspace . $scriptContent . PHP_EOL;
    $html .= $indent . '</script>' . PHP_EOL;
    $cachePath = $pagePath . '/cache';
    if ( ! is_dir($cachePath)) { mkdir($cachePath); }
    file_put_contents($cacheFilePath, $html);
    return $html;
  }

}

$ui = new UiClass($app);

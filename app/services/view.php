<?php

class View {

  public $app;
  public $dent;


  public function __construct($app, $dent = null)
  {
    $this->app = $app;
    $this->dent = $dent ?: '  ';  // OR "\t"
  }


  public function e($str)
  {
    if (is_string($str)) {
      return htmlspecialchars($str, ENT_QUOTES | ENT_IGNORE, "UTF-8", false);
    }
  }


  public function indent($n, $dent)
  {
    return $n ? str_repeat($dent, $n) : '';
  }


  public function indentBlock($text, $indent)
  {
    return implode("\n" . $indent, explode("\n", trim($text)));
  }


  public function menuItem($url, $label = null) {
    return '<li' . ($this->app->request->pageref == $url ? ' class="active">' : '>') .
      '<a href="' . $url . '" class="pagelink">' . ($label ?: $url) . '</a></li>' . PHP_EOL;
  }


  public function getMostRecentTimestamp(array $filePaths)
  {
    $mostRecent = 0;
    foreach ($filePaths as $filePath) {
      if ( ! file_exists($filePath)) { break; }
      $timestamp = filemtime($filePath);
      if ($timestamp > $mostRecent) { $mostRecent = $timestamp; }
    }
    return $mostRecent;
  }


  public function getDefaultCachePath($srcFilePath = null)
  {
    if (isset($this->app->page) and isset($this->app->page->cachePath)) {
      return $this->app->page->cachePath;
    }
    return dirname($srcFilePath) . '/cache';
  }


  /**
   * The "compiled/cached file" will only exist if the "source file" was not modified
   * since the last cache operation.
   *
   * NOTE: Add a pre-extension to $fileType to distinguish similar files.
   * E.g. ".pdf.html", ".csv.html" or .altview.html etc.
   */
  public function getCachedFilePath($srcFilePath, $fileType, $cachePath = null)
  {
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath($srcFilePath); }
    $srcFileTimestamp = filemtime($srcFilePath);
    return "$cachePath/$srcFileTimestamp.$fileType";
  }


  public function minify($content, $contentType = null)
  {
    $content = str_replace("\r", '', $content);
    $content = preg_replace('/\n+[\s\t]*/', "\n", $content);
    $content = preg_replace('@/\*.*?\*/@s', '', $content);
    if ($contentType == 'js') {
      $content = preg_replace('@(?<=\n)[\s\t]*//.*@', '', $content);
      // $content = preg_replace('/(F1\.)*console\.log.*?\);/', '', $content);
    }
    $content = preg_replace('/\n[\s\t]*\n+/', "\n", $content);
    return $content;
  }


  public function concatFiles(array $filePaths)
  {
    $content = '';
    foreach ($filePaths as $i => $filePath) {
      $content .= ($i ? PHP_EOL : '') . file_get_contents($filePath); }
    return $content;
  }


  public function cacheToFile($content, $filePath, $cachePath = null)
  {
    if ( ! $cachePath) { $cachePath = dirname($filePath); }
    // Make sure we are within our bounds when using mkdir with "true"!
    if ( ! is_dir($cachePath) and strpos($cachePath,
      $this->app->rootPath) !== false) { mkdir($cachePath, 0777, true); }
    file_put_contents($filePath, $content);
  }


  public function compile($filePath, $fileType, $dentCount, $dent,
    $before, $after, $cachePath = null, $inline = false)
  {
    $compiledFilePath = $this->getCachedFilePath($filePath, $fileType, $cachePath);
    if (file_exists($compiledFilePath)) { return $compiledFilePath; }
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    $content = $inline ? '' : $indent;
    $innerContent = file_get_contents($filePath);
    $innerContent = $this->indentBlock($innerContent, $indent . ($before ? $dent : ''));
    $content .= $before ? ($before . PHP_EOL . $indent . $dent) : '';
    $content .= $innerContent . PHP_EOL;
    if ($after) { $content .= $indent . $after . PHP_EOL; }
    $this->cacheToFile($content, $compiledFilePath, $cachePath);
    return $compiledFilePath;
  }


  public function globalStyles()
  {
    $srcFilePaths = array_get($this->app->client, 'globalStyles', []);
    $mostRecent = $this->getMostRecentTimestamp($srcFilePaths);
    if ( ! $mostRecent) { $mostRecent = time(); }
    $assetHref = "$mostRecent.app.css";
    $assetFilePath = $this->app->webRootPath."/$assetHref";
    if ( ! file_exists($assetFilePath))
    {
      $content = $this->concatFiles($srcFilePaths);
      $content = $this->minify($content, 'css');
      file_put_contents($assetFilePath, $content);
    }
    return '<link href="' . $assetHref . '" rel="stylesheet">' . PHP_EOL;
  }


  public function globalScripts()
  {
    $srcFilePaths = array_get($this->app->client, 'globalScripts', []);
    $mostRecent = $this->getMostRecentTimestamp($srcFilePaths);
    if ( ! $mostRecent) { $mostRecent = time(); }
    $assetHref = "$mostRecent.app.js";
    $assetFilePath = $this->app->webRootPath."/$assetHref";
    if ( ! file_exists($assetFilePath))
    {
      $content = $this->concatFiles($srcFilePaths);
      $content = $this->minify($content, 'js');
      file_put_contents($assetFilePath, $content);
    }
    return '<script src="' . $assetHref . '"></script>' . PHP_EOL;
  }


  public function inlineStyle($dentCount = 2, $dent = null, $cachePath = null)
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/style.css';
    if ( ! file_exists($filePath)) { return; }
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath(); }
    $before = '<style data-rel="page">'; $after = '</style>';
    return $this->compile($filePath, 'css', $dentCount, $dent,
      $before, $after, $cachePath, true);
  }


  public function inlineScript($dentCount = 4, $dent = null, $cachePath = null)
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/script.js';
    if ( ! file_exists($filePath)) { return; }
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath(); }
    $before = '<script>'; $after = '</script>';
    return $this->compile($filePath, 'js', $dentCount, $dent,
      $before, $after, $cachePath, true);
  }


  public function partialFile($cachePath, $filePath, $fileType = 'html',
    $dentCount = null, $dent = null, $before = null, $after = null, $inline = false)
  {
    if ( ! file_exists($filePath)) { return; }
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath(); }
    return $this->compile($filePath, $fileType, $dentCount?:4, $dent,
      $before, $after, $cachePath, $inline);
  }


  public function inlinePartialFile($cachePath, $filePath, $fileType = 'html',
    $dentCount = null, $dent = null, $before = null, $after = null)
  {
    return $this->partialFile($cachePath, $filePath, $fileType,
      $dentCount, $dent, $before, $after, true);
  }


  public function alerts($dentCount = 3, $dent = null)
  {
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    $alerts = $this->app->page->alerts;
    $html  = '<div id="alerts">';
    if ( ! $alerts) { return $html . '</div>' . PHP_EOL; }
    else { $html .= PHP_EOL; }
    foreach($alerts as $alert)
    {
      $html .= $indent . $dent;
      $html .= '<div class="alert ' . $alert[0] . '" data-ttl="' . $alert[2] . '">' . $alert[1] . '</div>';
      $html .= PHP_EOL;
    }
    $html .= $indent . '</div>' . PHP_EOL;
    return $html;
  }


  public function breadcrumbs($pageTitle, $crumbs = null)
  {
    $linkHtml = [];
    foreach ($crumbs?:[] as $linkText => $link)
    {
      $linkHtml[] = '<a class="pagelink" href="' . $link . '">' . $linkText . '</a>';
    }
    return $linkHtml ? implode(' / ', $linkHtml) . " / $pageTitle" : $pageTitle;
  }

}

$view = new View($app);

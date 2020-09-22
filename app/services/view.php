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


  public function assetPathToHref($assetFilePath)
  {
    $href = str_replace($this->app->appPath, '', $assetFilePath);
    if ($href == $assetFilePath)  {
      // Asset not in APP_PATH. Thus it's in PUBLIC_HTML... Just chop the root!
      return trim(str_replace($this->app->webRootPath, '', $assetFilePath), '/');
    }
    // Copy the "private" asset file into public_html to ease DEV debugging.
    $publicDir  = $this->app->assetsPath . dirname($href);
    $publicFile = $this->app->assetsPath . $href;
    if ( ! is_dir($publicDir)) {
      $oldumask = umask(0);
      mkdir($publicDir, 0755, true);
      umask($oldumask);
    }
    if ( ! file_exists($publicFile) or filemtime($publicFile) != filemtime($assetFilePath)) {
      copy($assetFilePath, $publicFile);
    }
    return $this->app->assetsUri . $href;
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


  public function getDefaultCachePath($assetFilePath = null)
  {
    if (isset($this->app->page) and isset($this->app->page->cachePath)) {
      return $this->app->page->cachePath;
    }
    return dirname($assetFilePath) . '/cache';
  }


  /**
   * The "compiled/cached file" will only exist if the "source file" was not modified
   * since the last cache operation.
   *
   * NOTE: Add a pre-extension to $fileType to distinguish similar files.
   * E.g. ".pdf.html", ".csv.html" or .altview.html etc.
   */
  public function getCachedFilePath($assetFilePath, $fileType, $cachePath = null)
  {
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath($assetFilePath); }
    $srcFileTimestamp = filemtime($assetFilePath);
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


  public function styleLinks($dentCount = 2, $dent = null)
  {
    $assetFilePaths = isset($this->app->styles) ? $this->app->styles : [];
    if (__ENV_PROD__)
    {
      $mostRecent = $this->getMostRecentTimestamp($assetFilePaths);
      if ( ! $mostRecent) { $mostRecent = time(); }
      $assetHref = "assets/$mostRecent.css";
      $assetFilePath = $this->app->webRootPath."/$assetHref";
      if ( ! file_exists($assetFilePath))
      {
        $content = $this->concatFiles($assetFilePaths);
        $content = $this->minify($content, 'css');
        file_put_contents($assetFilePath, $content);
      }
      $assetFilePaths = [ $assetFilePath ];
    }

    if (isset($this->app->page->styles)) {
      $assetFilePaths = array_merge($assetFilePaths, $this->app->page->styles);
    }

    $html = '';
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    foreach ($assetFilePaths as $i => $assetFilePath)
    {
      $assetHref = $this->assetPathToHref($assetFilePath);
      $html .= ($i ? $indent : '') . '<link href="' . $assetHref . '" rel="stylesheet">' . PHP_EOL;
    }
    return $html;
  }


  public function scriptLinks($dentCount = 2, $dent = null)
  {
    $assetFilePaths = isset($this->app->scripts) ? $this->app->scripts : [];
    $hasPageScripts = ! empty($this->app->page->scripts);
    $mainJs = $hasPageScripts ? array_get($assetFilePaths, 'main') : null;

    if (__ENV_PROD__)
    {
      $minifiedFiles = [];
      foreach ($assetFilePaths as $group => $groupFilePaths)
      {
        if ($hasPageScripts and $group == 'main') { continue; }
        $mostRecent = $this->getMostRecentTimestamp($groupFilePaths);
        if ( ! $mostRecent) { $mostRecent = time(); }
        $assetHref = "{$this->app->assetsUri}/$group-$mostRecent.js";
        $minifiedFile = "{$this->app->webRootPath}/$assetHref";
        $minifiedFiles[] = $minifiedFile;
        if ( ! file_exists($minifiedFile))
        {
          $content = $this->concatFiles($groupFilePaths);
          $content = $this->minify($content, 'js');
          file_put_contents($minifiedFile, $content);
        }
      }
      $assetFilePaths = $minifiedFiles;
    }
    else
    {
      $ungroupedFiles = [];
      foreach ($assetFilePaths as $group => $groupFilePaths)
      {
        if ($hasPageScripts and $group == 'main') { continue; }
        foreach($groupFilePaths as $groupFile) { $ungroupedFiles[] = $groupFile; }
      }
      $assetFilePaths = $ungroupedFiles;
    }

    if ($hasPageScripts) {
      $assetFilePaths = array_merge($assetFilePaths, $this->app->page->scripts);
    }

    $html = '';
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    foreach ($assetFilePaths as $i => $assetFilePath)
    {
      $assetHref = $this->assetPathToHref($assetFilePath);
      $html .= ($i ? $indent : '') . '<script src="' . $assetHref . '"></script>' . PHP_EOL;
    }

    if ($mainJs) {
      $assetHref = $this->assetPathToHref($mainJs);
      $html .= ($i ? $indent : '') . '<script src="' . $assetHref . '"></script>' . PHP_EOL;
    }

    return $html;
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


  public function renderTemplate($cachePath, $filePath, $fileType = 'html',
    $dentCount = null, $dent = null, $before = null, $after = null, $inline = false)
  {
    if ( ! file_exists($filePath)) { return; }
    if ( ! $cachePath) { $cachePath = $this->getDefaultCachePath(); }
    return $this->compile($filePath, $fileType, $dentCount?:4, $dent,
      $before, $after, $cachePath, $inline);
  }


  public function inlineTemplate($cachePath, $filePath, $fileType = 'html',
    $dentCount = null, $dent = null, $before = null, $after = null)
  {
    return $this->renderTemplate($cachePath, $filePath, $fileType,
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

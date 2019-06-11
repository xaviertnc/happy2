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


  public function compile($pagePath, $filePath, $fileExt, $dentCount,
    $dent, $before, $after, $firstDent = null)
  {
    $timestamp = filemtime($filePath);
    $cacheFilePath = "$pagePath/cache/$timestamp.$fileExt";
    if (file_exists($cacheFilePath)) { return $cacheFilePath; }
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    $content = file_get_contents($filePath);
    $content = $this->indentBlock($content, $indent . $dent);
    $html = $firstDent;
    $html .= $before ? ($before . PHP_EOL . $indent . $dent) : '';
    $html .= $content . PHP_EOL;
    if ($after) { $html .= $indent . $after . PHP_EOL; }
    $cachePath = $pagePath . '/cache';
    if ( ! is_dir($cachePath)) { mkdir($cachePath); }
    file_put_contents($cacheFilePath, $html);
    return $cacheFilePath;
  }


  public function partialFile($pagePath, $filePath, $fileExt = 'html',
    $dentCount = null, $dent = null, $firstDent = null)
  {
    if ( ! file_exists($filePath)) { return; }
    return $this->compile($pagePath, $filePath, $fileExt, $dentCount?:3, $dent, null, null, $firstDent);
  }


  public function styleFile($dentCount = 2, $dent = null)
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/style.css';
    if ( ! file_exists($filePath)) { return; }
    $before = '<style data-rel="page">'; $after = '</style>';
    return $this->compile($pagePath, $filePath, 'css', $dentCount, $dent, $before, $after);
  }


  public function scriptFile($dentCount = 4, $dent = null)
  {
    $pagePath = $this->app->page->dir;
    $filePath = $pagePath . '/script.js';
    if ( ! file_exists($filePath)) { return; }
    $before = '<script>'; $after = '</script>';
    return $this->compile($pagePath, $filePath, 'js', $dentCount, $dent, $before, $after);
  }


  public function styleLinks(array $styleLinks, $dentCount, $dent = null)
  {
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    $html = '';
    foreach ($styleLinks as $i => $styleHref)
    {
      $html .= ($i ? $indent : '') . '<link href="' . $styleHref . '" rel="stylesheet">' . PHP_EOL;
    }
    return $html;
  }


  public function scriptTags(array $scripts, $dentCount, $dent = null)
  {
    $dent = $dent ?: $this->dent;
    $indent = $this->indent($dentCount, $dent);
    $html = '';
    foreach ($scripts as $i => $script)
    {
      $html .= ($i ? $indent : '') .
        '<script' . (isset($script['async']) ? ' async defer' : '') .
          ' src="' . $script['src'] . '"></script>' . PHP_EOL;
    }
    return $html;
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

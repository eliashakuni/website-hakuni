<?php
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Origin: *');
$lang = htmlspecialchars($_GET['lang']);
$dictionary = file('./modsanakirja.txt', FILE_IGNORE_NEW_LINES);
$table = [[], [], [], []];
$wordList = [];
$letters = [];
$letterFrequency = [];
$dictionaryLength= count($dictionary);
$tries=0;
$minimumPoints=0;
loadLanguageFiles();
main();

function main(){
    global $wordList, $minimumPoints;
    goodTable($minimumPoints);
    sort($wordList);
    output();
}

function output() {
    header('Content-type: text/plain');
    echo json_encode(['table' => $GLOBALS['table'], 'wordList' => $GLOBALS['wordList'], 'tries' => $GLOBALS['tries'], 'points' => countPoints()], JSON_UNESCAPED_UNICODE);
}

function goodTable($minimumPoints) {
    global $wordList, $tries, $table;
    do {
        newTable();
        for ($i = 0; $i < 4; $i++) {
            for ($j = 0; $j < 4; $j++) {
                $position = [];
                $position[] = ((string)$i) . ((string)$j);
                crawler($position, mb_strtolower($table[$i][$j]));
            }
        }
        $points = countPoints();
        $tries++;
    } while ($points<$minimumPoints);
}

function newTable(){
    global $table, $wordList;
    for ($i = 0; $i < 4; $i++) {
        for ($j = 0; $j < 4; $j++) {
            $table[$i][$j] = randChar();
        }
    }
    $wordList = [];
}

function randChar() {
    global $letters, $letterFrequency;
    $rand = rand();
    $i=0;
    foreach($letterFrequency as $freq) {
        if($rand<$freq) {
            return $letters[$i];
        }
        $i++;
    }
}

function crawler($path, $word) {
    global $dictionary, $wordList;

    if(strlen($word)>=3) {
        $listPosition = binarySearch($word, $dictionary);
        if ($word == $dictionary[$listPosition]) {
            if (!in_array($word, $wordList, true)) {
                $wordList[] = $word;
            }
        }
        if(!stillPossibleWord($word, $listPosition)) {
            return;
        }
    }
    $x = ((int)($path[count($path)-1][0]));
    $y = ((int)($path[count($path)-1][1]));
    $right = ($x+1<=3);
    $up = ($y+1<=3);
    $left = ($x-1>=0);
    $down = ($y-1>=0);
    if($right) {
        crawlDirection($x, $y, 1, 0, $path, $word);
    }
    if($right && $up) {
        crawlDirection($x, $y, 1, 1, $path, $word);
    }
    if($up) {
        crawlDirection($x, $y, 0, 1, $path, $word);
    }
    if($left && $up) {
        crawlDirection($x, $y, -1, 1, $path, $word);
    }
    if($left) {
        crawlDirection($x, $y, -1, 0, $path, $word);
    }
    if($left && $down) {
        crawlDirection($x, $y, -1, -1, $path, $word);
    }
    if($down) {
        crawlDirection($x, $y, 0, -1, $path, $word);
    }
    if($right && $down) {
        crawlDirection($x, $y, 1, -1, $path, $word);
    }
}

function crawlDirection($x, $y, $xdir, $ydir, $path, $word) {
    global $table;
    if(!in_array((string)($x+$xdir) . (string)($y+$ydir), $path)) {
        $newpath=$path;
        $newpath[] = (string)($x+$xdir) . (string)($y+$ydir);
        crawler($newpath, $word . mb_strtolower($table[$x+$xdir][$y+$ydir]));
    }
}

function stillPossibleWord($word, $listPosition) {
    global $wordList, $dictionary;
    $listPointer = $listPosition;
    while ((strcmp($dictionary[$listPointer], $word) > 0)) {
        if ($word == substr($dictionary[$listPointer], 0, strlen($word)) && !in_array($dictionary[$listPointer], $wordList, true)) {
            return true;
        }
        $listPointer--;
        if($listPointer < 0) {
            break;
        }
    }
    $listPointer = $listPosition + 1;
    do {
        if ($listPointer >= $GLOBALS['dictionaryLength']) {
            break;
        }
        $subword = substr($dictionary[$listPointer], 0, strlen($word));
        if ($word == $subword && !in_array($dictionary[$listPointer], $wordList, true)) {
            return true;
        } else 
        $listPointer++;
    } while (strcmp($subword, $word) <= 0);
    return false;
}

function binarySearch($word, $array)
{
    $bottom = 0;
    $top = count($array)-1;
    while ($bottom <= $top) {
        $current = $bottom + (int) (($top - $bottom) / 2);
        $res = strcmp($word, $array[$current]);

        // Check if x is present at mid 
        if ($res == 0) {
            return $current;
        }
        // If x greater, ignore left half 
        if ($res > 0){
            $bottom = $current + 1;
        } else {
            $top = $current - 1;
        }
    }
    return $current;
}

function countPoints() {
    global $wordList;
    $points=0;
    foreach($wordList as $word) {
        $points += 2**(strlen($word));
    }
    return $points;
}

function loadLanguageFiles() {
    global $dictionary, $letters, $letterFrequency, $lang. $minimumPoints;

    $dictionaryPath = './languageFiles/';
    $letterPath = './languageFiles/';
    if ($lang == 'fi') {
        $dictionaryPath .= 'finnish/modifiedFinnishWordlist.txt';
        $letterPath .= 'finnish/finnishLetters.txt';
        $minimumPoints = 7000;
    } elseif ($lang == 'se') {
        $dictionaryPath .= 'swedish/modifiedSwedishWordlist.txt';
        $letterPath .= 'swedish/swedishLetters.txt';
        $minimumPoints = 5000;
    }

    $dictionary = file($dictionaryPath, FILE_IGNORE_NEW_LINES);
    $letterFile = file($letterPath, FILE_IGNORE_NEW_LINES);

    foreach ($letterFile as $i=>$line) {
        if ($i%2 == 0) {
            $letters[] = $line;
        }
        if ($i%2 != 0) {
            $letterFrequency[] = $line;
        }
    }
}

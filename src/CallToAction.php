<?php


namespace SLONline\CallToActions;


use SilverStripe\Core\Config\Config;
use SilverStripe\View\Parsers\ShortcodeParser;
use SilverStripe\View\ViewableData;

class CallToAction extends ViewableData
{
    private static $calltoaction_classes = [];
    
    public static function register_classes($classes)
    {
        if (is_array($classes) && count($classes)) {
            foreach ($classes as $class) {
                self::register_class($class);
            }
        }
    }
    
    public static function register_class($class)
    {
        if (class_exists($class)) {
            if (!singleton($class)->hasMethod('parse_shortcode')) {
                user_error("Failed to register \"$class\" with CallToAction. $class must have the method parse_shortcode(). See README.md",
                    E_USER_ERROR);
            }
            ShortcodeParser::get('default')->register(
                Config::inst()->get($class, 'shortcode'),
                [$class, 'parse_shortcode']);
        }
    }
    
    /**
     * Returns list of shortcodes for dropdown
     * @return array
     */
    public static function get_shortcodes_fordropdown()
    {
        $classList  = self::get_calltoaction_classes();
        $shortcodes = [];
        if (is_array($classList)) {
            foreach ($classList as $class) {
                $shortcode = Config::inst()->get($class, 'shortcode');
                if (empty($shortcode)) {
                    $shortcode = $class;
                }
                
                if (singleton($class)->hasMethod('singular_name')) {
                    $shortcodes[$shortcode] = singleton($class)->singular_name();
                } else {
                    $shortcodes[$shortcode] = $class;
                }
            }
        }
        
        return $shortcodes;
    }
    
    public static function get_calltoaction_classes()
    {
        $list    = [];
        $classes = Config::inst()->get(CallToAction::class, 'calltoaction_classes');
        if ($classes) {
            foreach ($classes as $class) {
                $shortcode = Config::inst()->get($class, 'shortcode');
                if (empty($shortcode)) {
                    $shortcode = $class;
                }
                $list[$shortcode] = $class;
            }
        }
        
        return $list;
    }
    
    public static function get_cta_codes_with_placeholders()
    {
        $codes = [];
        foreach (self::get_calltoaction_classes_with_placeholders() as $class) {
            $code = Config::inst()->get($class, 'shortcode');
            if (!$code) {
                $code = $class;
            }
            $codes[$class] = $code;
        }
        
        return $codes;
    }
    
    public static function get_calltoaction_classes_with_placeholders()
    {
        $classes = [];
        foreach (self::get_calltoaction_classes() as $class) {
            if (singleton($class)->hasMethod('getCallToActionPlaceHolder')) {
                $classes[] = $class;
            }
        }
        
        return $classes;
    }
}
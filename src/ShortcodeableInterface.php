<?php


namespace SLONline\CallToActions;


use SilverStripe\View\Parsers\ShortcodeParser;

interface ShortcodeableInterface
{
    /**
     * Parse the shortcode and render as a string, probably with a template
     *
     * @param array           $attributes the list of attributes of the shortcode
     * @param string          $content    the shortcode content
     * @param ShortcodeParser $parser     the ShortcodeParser instance
     * @param string          $shortcode  the raw shortcode being parsed
     *
     * @return string
     **/
    public static function parse_shortcode($attributes, $content, $parser, $shortcode): string;
    
    /**
     * Returns a link to an image to be displayed as a placeholder in the editor
     * In this example we make easy work of this task by using the placehold.it service
     * But you could also return a link to an image in the filesystem - perharps the first
     * image in this ImageGallery
     * a placeholder
     *
     * @param array $attributes the list of attributes of the shortcode
     *
     * @return string
     **/
    public function getCallToActionPlaceHolder($attributes): string;
    
    public function singular_name();
}
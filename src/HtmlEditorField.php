<?php


namespace SLONline\CallToActions;


use SilverStripe\Core\Extension;

class HtmlEditorField extends Extension
{
    public function onBeforeRender()
    {
        $this->owner->setAttribute(
            'data-placeholderclasses',
            implode(',', CallToAction::get_cta_codes_with_placeholders())
        );
    }
}
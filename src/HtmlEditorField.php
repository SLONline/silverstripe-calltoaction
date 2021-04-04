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
        
        if ($this->owner->getForm()) {
            $data = $this->owner->getForm()->getData();
            
            if (\is_array($data)) {
                if (\array_key_exists('ClassName', $data)) {
                    $this->owner->setAttribute('data-cta-dataobjectclassname', $data['ClassName']);
                }
                if (\array_key_exists('ID', $data)) {
                    $this->owner->setAttribute('data-cta-dataobjectid', $data['ID']);
                }
            }
        }
    }
}
<?php


namespace SLONline\CallToActions;


use SilverStripe\Admin\LeftAndMain;
use SilverStripe\AssetAdmin\Forms\UploadField;
use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Core\Config\Config;
use SilverStripe\Forms\CompositeField;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\Forms\LiteralField;
use SilverStripe\ORM\DataObject;
use SilverStripe\Security\Permission;
use SilverStripe\View\Parsers\ShortcodeParser;

class CallToActionController extends LeftAndMain
{
    private static $ca_url_segment = 'CallToActionController';
    private static $required_permission_codes = false;
    
    /**
     * @var array
     */
    private static $allowed_actions = [
        'CallToActionForm',
        'handleEdit',
        'shortcodePlaceHolder',
    ];
    
    /**
     * @var array
     */
    private static $url_handlers = [
        'edit/$CallToActionType!/$Action//$ID/$OtherID' => 'handleEdit',
    ];
    
    /**
     * @var string
     */
    protected $calltoactionclass;
    
    /**
     * @var array
     */
    protected $shortcodedata;
    
    /**
     * @var boolean
     */
    protected $isnew = true;
    
    /**
     * Get the shortcodable class by whatever means possible.
     * Determine if this is a new shortcode, or editing an existing one.
     */
    public function init()
    {
        parent::init();
        if ($data = $this->getShortcodeData()) {
            $this->isnew             = false;
            $this->calltoactionclass = $data['name'];
        } elseif ($type = $this->request->requestVar('CallToActionType')) {
            $this->calltoactionclass = $type;
        } else {
            $this->calltoactionclass = $this->request->param('CallToActionType');
        }
        
        $clases = CallToAction::get_calltoaction_classes();
        if (\array_key_exists($this->calltoactionclass, $clases)) {
            $this->calltoactionclass = $clases[$this->calltoactionclass];
        }
    }
    
    /**
     * Get the shortcode data from the request.
     * @return array shortcodedata
     */
    protected function getShortcodeData()
    {
        if ($this->shortcodedata) {
            return $this->shortcodedata;
        }
        
        if ($shortcode = $this->request->requestVar('Shortcode')) {
            //remove BOM inside string on cursor position...
            $shortcode = str_replace("\xEF\xBB\xBF", '', $shortcode);
            $data      = ShortcodeParser::get('default')->extractTags($shortcode);
            
            if (isset($data[0])) {
                $this->shortcodedata = [
                    'name'             => $data[0]['open'],
                    'atts'             => $data[0]['attrs'],
                    'original_content' => $data[0]['text'],
                    'content'          => $data[0]['content'],
                ];
                
                return $this->shortcodedata;
            }
        }
    }
    
    /**
     * handleEdit
     */
    public function handleEdit(HTTPRequest $request)
    {
        $this->calltoactionclass = $request->param('CallToActionType');
        $clases                  = CallToAction::get_calltoaction_classes();
        if (\array_key_exists($this->calltoactionclass, $clases)) {
            $this->calltoactionclass = $clases[$this->calltoactionclass];
        }
        
        return $this->handleAction($request, $action = $request->param('Action'));
    }
    
    /**
     * Point to edit link, if shortcodable class exists.
     */
    public function Link($action = null)
    {
        if ($this->calltoactionclass) {
            return Controller::join_links(
                $this->config()->url_base,
                $this->config()->ca_url_segment,
                'edit',
                $this->calltoactionclass
            );
        }
        
        return Controller::join_links($this->config()->url_base, $this->config()->ca_url_segment, $action);
    }
    
    /**
     * Provides a GUI for the insert/edit shortcode popup.
     *
     * @return Form
     **/
    public function CallToActionForm()
    {
        $shortcodes = CallToAction::get_shortcodes_fordropdown();
        $classname  = $this->calltoactionclass;
        if ($this->isnew) {
            $headingText = _t('CallToAction.EDITTITLE', 'Edit Call to Action');
        } else {
            $headingText = sprintf(
                _t('CallToAction.EDITSHORTCODE', 'Edit %s Call to Action'),
                singleton($this->calltoactionclass)->singular_name()
            );
        }
        
        // essential fields
        $fields = FieldList::create([
            CompositeField::create(
                LiteralField::create(
                    'Heading',
                    sprintf('<h3 class="htmleditorfield-ctaform-heading insert">%s</h3>', $headingText)
                )
            )->addExtraClass('CompositeField composite cms-content-header nolabel'),
            LiteralField::create('shortcodablefields', '<div class="ss-shortcodable content">'),
            DropdownField::create('CallToActionType', _t('Shortcodable.CTATYPE', 'Call to Action Type'), $shortcodes,
                Config::inst()->get($classname, 'shortcode'))
                         ->setHasEmptyDefault(true)
                         ->addExtraClass('shortcode-type'),
        ]);
        
        // attribute and object id fields
        if ($classname && class_exists($classname)) {
            $class = singleton($classname);
            if (is_subclass_of($class, DataObject::class)) {
                if (singleton($classname)->hasMethod('getShortcodableRecords')) {
                    $dataObjectSource = singleton($classname)->getShortcodableRecords();
                } else {
                    $dataObjectSource = $classname::get()->map()->toArray();
                }
                $fields->push(
                    DropdownField::create('id', $class->singular_name(), $dataObjectSource)
                                 ->setHasEmptyDefault(true)
                );
            }
            if (singleton($classname)->hasMethod('getShortcodeFields')) {
                if ($attrFields = singleton($classname)->getShortcodeFields()) {
                    $fields->push(
                        CompositeField::create($attrFields)
                                      ->addExtraClass('attributes-composite')
                                      ->setName('AttributesCompositeField')
                    );
                }
            }
        }
        
        // actions
        $actions = FieldList::create([
            FormAction::create('insert', _t('Shortcodable.BUTTONINSERTSHORTCODE', 'Insert Call to Action'))
                      ->addExtraClass('btn-primary font-icon-save')
                      ->setUseButtonTag(true),
        ]);
        
        // form
        $form = Form::create($this, 'CallToActionForm', $fields, $actions)
                    ->loadDataFrom($this)
                    ->addExtraClass('htmleditorfield-form htmleditorfield-cta cms-dialog-content');
        
        $this->extend('updateCTAForm', $form);
        
        $fields->push(LiteralField::create('shortcodablefieldsend', '</div>'));
        
        if ($data = $this->getShortcodeData()) {
            $data['atts']['content'] = $data['content'];
            $form->loadDataFrom($data['atts']);
            
            // special treatment for setting value of UploadFields
            foreach ($form->Fields()->dataFields() as $field) {
                if (is_a($field, UploadField::class) && isset($data['atts'][$field->getName()])) {
                    $field->setValue(['Files' => explode(',', $data['atts'][$field->getName()])]);
                }
            }
        }
        
        return $form;
    }
    
    /**
     * Generates shortcode placeholder to display inside TinyMCE instead of the shortcode.
     *
     * @param HTTPRequest $request
     *
     * @return void
     */
    public function shortcodePlaceHolder($request)
    {
        if (!Permission::check('CMS_ACCESS_CMSMain')) {
            return;
        }
        
        $code      = $request->param('ID');
        $classname = '';
        if (\in_array($code, CallToAction::get_cta_codes_with_placeholders())) {
            $classname = array_search($code, CallToAction::get_cta_codes_with_placeholders());
        }
        
        $id = $request->param('OtherID');
        
        if (!class_exists($classname)) {
            return;
        }
        
        if ($id) {
            $object = $classname::get()->byID($id);
        } else {
            $object = singleton($classname);
        }
        
        if ($object->hasMethod('getCallToActionPlaceHolder')) {
            $data = \json_decode($request->getBody(), true);
            
            return $object->getCallToActionPlaceHolder($data);
        }
    }
    
    public function canView($member = null)
    {
        return true;
    }
}
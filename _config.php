<?php

use SilverStripe\Core\Config\Config;
use SilverStripe\Core\Manifest\ModuleLoader;
use SilverStripe\Forms\HTMLEditor\TinyMCEConfig;
use SLONline\CallToActions\CallToAction;

// Avoid creating global variables
call_user_func(function () {
    $module = ModuleLoader::inst()->getManifest()->getModule('slonline/silverstripe-calltoaction');
    // Re-enable media dialog
    $config = TinyMCEConfig::get('cms');
    $config->enablePlugins([
        'calltoaction' => $module
            ->getResource('client/dist/js/TinyMCE_call-to-action.js'),
    ]);
    $config->insertButtonsAfter('table', 'calltoaction');
    
    $config->setOption(
        'extended_valid_elements',
        'b,i,strong,form,button,input[name|placeholder|autocomplete|class],style'
    );
    $config->setOption('custom_elements', 'style,button,form,strong');
    
    $config->enablePlugins('fullscreen')
           ->insertButtonsAfter('code', 'fullscreen');
});

// register classes added via yml config
CallToAction::register_classes(Config::inst()->get('SLONline\CallToActions\CallToAction', 'calltoaction_classes'));
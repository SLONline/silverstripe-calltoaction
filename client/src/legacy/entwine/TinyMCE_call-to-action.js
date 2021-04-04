/* global tinymce, editorIdentifier, ss */
/* eslint-disable
  no-param-reassign,
  func-names
*/

import i18n from 'i18n';
import jQuery from 'jquery';
import ShortcodeSerialiser from 'lib/ShortcodeSerialiser';
import React from 'react';

const commandName = 'calltoaction';

const plugin = {
	init(editor) {
		editor.addButton('calltoaction', {
			text: i18n._t('CallToAction.ACTION_LABEL', '[CtA]'),
			tooltip: i18n._t('CallToAction.ACTION_TOOLTIP', 'Insert Call to Action'),
			icon: false,
			class: 'mce_shortcode',
			cmd: commandName
		});

		editor.addCommand(commandName, () => {
			jQuery(`#${editor.id}`).entwine('ss').openCallToActionDialog(editor);
		});

		editor.addContextToolbar(
			(embed) => editor.dom.is(embed, 'div[data-cta-shortcode]'),
			'calltoaction'
		);

		this.beforeSetContent(editor);
		this.onSetContent(editor);
		this.onPreProcess(editor);
	},

	handleRemoveCallToActionClick(editor) {

	},
	beforeSetContent(editor) {
		editor.on('beforeSetContent', (e) => {
			const placeholderClasses = jQuery(`#${editor.id}`).entwine('ss').getPlaceholderClasses();
			let content = e.content;
			if (placeholderClasses) {
				placeholderClasses.forEach((code) => {
					let match = null;
					let counter = 0;
					while ((match = ShortcodeSerialiser.match(code, true, content)) && counter < 1000) {
						counter +=1;
						if (match) {
							const params = [];
							const url = encodeURI(`CallToActionController/shortcodePlaceHolder/${code}`);
							$.ajax({
								url,
								type       : 'POST',
								data       : JSON.stringify(match),
								contentType: 'application/json; charset=utf-8',
								async      : false,
								success(html) {
									html = $($(html));
									html.attr('data-cta-shortcode', match.name);
									html.attr('data-cta-shortcode-wrapped', match.wrapped);
									html.attr('data-cta-shortcode-properties', JSON.stringify(match.properties));
									html.attr('data-cta-shortcode-content', JSON.stringify(match.content));
									content = content.replaceAll(match.original, html.prop('outerHTML'));
								}
							});
						}
					}

					counter = 0;
					while ((match = ShortcodeSerialiser.match(code, false, content)) && counter < 1000) {
						counter +=1;
						if (match) {
							const params = [];
							const url = encodeURI(`CallToActionController/shortcodePlaceHolder/${code}`);
							$.ajax({
								url,
								type       : 'POST',
								data       : JSON.stringify(match),
								contentType: 'application/json; charset=utf-8',
								async      : false,
								success(html) {
									html = $($(html));
									html.attr('data-cta-shortcode', match.name);
									html.attr('data-cta-shortcode-wrapped', match.wrapped);
									html.attr('data-cta-shortcode-properties', JSON.stringify(match.properties));
									html.attr('data-cta-shortcode-content', JSON.stringify(match.content));
									content = content.replaceAll(match.original, html.prop('outerHTML'));
								}
							});
						}
					}
				});
			}
			e.content = content;
		});
	},
	onPreProcess(editor) {
		editor.on('PreProcess', (e) => {
			$('[data-cta-shortcode]', e.node).each((idx, elm) => {
				const $elm = $(elm);
				$elm.removeAttr('contentEditable');
				const code = $elm.data('cta-shortcode');
				const wrapped = $elm.data('cta-shortcode-wrapped');
				const properties = $elm.data('cta-shortcode-properties');
				const content = $elm.data('cta-shortcode-content');

				const shortcode = ShortcodeSerialiser.serialise({
					name: code,
					properties: properties,
					content: content,
					wrapped: wrapped
				}, true);
				$elm.replaceWith(shortcode);
			});
		});
	},
	onSetContent(editor) {
		editor.on('SetContent', (e) => {
			const unprocessed = editor.$('[data-cta-shortcode]');
			editor.undoManager.transact(() => {
				unprocessed.each((idx, elm) => {
					elm.contentEditable = false;
				});
			});
		});
	},
};

jQuery.entwine('ss', ($) => {
	// handle change on shortcode-type field
	$('select.shortcode-type').entwine({
		onchange() {
			this.parents('form:first').reloadForm('type', this.val());
		}
	});

	// Dialog
	$('.htmleditorfield-dialog').entwine({
		Bookmark: null,
		onadd() {
			// Create jQuery dialog
			if (!this.is('.ui-dialog-content')) {
				this.ssdialog({ autoOpen: true });
			}

			this._super();
		},

		getForm() {
			return this.find('form');
		},
		open(editor) {
			this.ssdialog('open');
		},
		close() {
			this.ssdialog('close');
		},
		toggle(bool) {
			if (this.is(':visible')) this.close();
			else this.open();
		}
	});

	// open shortcode dialog
	$('textarea.htmleditor').entwine({
		getPlaceholderClasses() {
			const classes = $(this).data('placeholderclasses');
			if (classes) {
				return classes.split(',');
			}
		},
		getCtaDataObjectClassName() {
			return $(this).data('cta-dataobjectclassname');
		},
		getCtaDataObjectID() {
			return $(this).data('cta-dataobjectid');
		},
		openCallToActionDialog(editor) {
			let self = this,
			    url = 'CallToActionController/CallToActionForm/forTemplate',
			    dialog = $('.htmleditorfield-calltoaction-dialog'),
			    bookmark = editor.selection.getBookmark(2, true);

			if (dialog.length) {
				dialog.getForm().setElement(this);
				dialog.setBookmark(bookmark);
				dialog.open(editor);
			} else {
				dialog = $('<div class="htmleditorfield-dialog htmleditorfield-calltoaction-dialog loading">');
				$('body').append(dialog);
				$.ajax({
					url,
					complete() {
						dialog.removeClass('loading');
					},
					success(html) {
						dialog.html(html);
						dialog.getForm().setElement(self);
						dialog.setBookmark(bookmark);
						dialog.open(editor);
						dialog.trigger('ssdialogopen');
					}
				});
			}
		},
	});

	$('form.htmleditorfield-cta').entwine({
		Selection: null,

		// Implementation-dependent serialization of the current editor selection state
		Bookmark: null,

		// DOMElement pointing to the currently active textarea
		Element: null,

		setSelection(node) {
			return this._super($(node));
		},
		onremove() {
			this.setSelection(null);
			this.setBookmark(null);
			this.setElement(null);

			this._super();
		},
		// load the shortcode form into the dialog
		reloadForm(from, data) {
			const postdata = {};
			const editor = this.getEditor();

			if (from == 'type') {
				postdata.CallToActionType = data;
			} else if (from == 'shortcode') {
				postdata.Shortcode = data;
			}

			postdata.DataObjectClassName = jQuery(`#${editor.getInstance().id}`).entwine('ss').getCtaDataObjectClassName();
			postdata.DataObjectID = jQuery(`#${editor.getInstance().id}`).entwine('ss').getCtaDataObjectID();

			this.addClass('loading');

			const url = 'CallToActionController/CallToActionForm/forTemplate';

			$.post(url, postdata, (data) => {
				const form = $('form.htmleditorfield-cta');
				form.find('fieldset').replaceWith($(data).find('fieldset')).show();
				form.removeClass('loading');
			});
			return this;
		},
		onsubmit(e) {
			this.insertShortcode();
			this.getDialog().close();
			return false;
		},

		// insert shortcode into editor
		insertShortcode() {
			const shortcode = this.getHTML();
			if (shortcode.length) {
				this.modifySelection((ed) => {
					const editor = ed.getInstance();
					editor.undoManager.transact(() => {
						const calltoaction = tinyMCE.activeEditor.plugins.calltoaction;
						ed.replaceContent(shortcode);
					});
				});
			}
		},
		modifySelection(callback) {
			const ed = this.getEditor();

			ed.moveToBookmark(this.getBookmark());
			callback.call(this, ed);

			this.setSelection(ed.getSelectedNode());
			this.setBookmark(ed.createBookmark());

			ed.blur();
		},

		getEditor() {
			return this.getElement().getEditor();
		},
		getDialog() {
			return this.closest('.htmleditorfield-dialog');
		},
		// get the html to insert
		getHTML() {
			const data = this.getAttributes();

			let content = null;
			if (data.attributes['content']) {
				content = data.attributes['content'];
			}
			const wrapped = (content !== null);
			const properties = [];
			for (const key in data.attributes) {
				if (key != 'content') {
					properties[key] = data.attributes[key];
				}
			}

			const shortcode = ShortcodeSerialiser.serialise({
				name: data.shortcodeType,
				properties: properties,
				content: content,
				wrapped: wrapped
			}, true);
			return shortcode;

			let html = data.shortcodeType;
			for (const key in data.attributes) {
				html += ` ${key}="${data.attributes[key]}"`;
			}

			if (html.length) {
				return `[${html}]`;
			}
				return '';
		},
		// get shortcode attributes from shortcode form
		getAttributes() {
			const attributes = {};
			const id = this.find(':input[name=id]').val();
			if (id) {
				attributes.id = id;
			}
			const data = JSON.stringify(this.serializeArray());

			const attributesComposite = this.find('.attributes-composite');
			if (attributesComposite.length) {
				attributesComposite.find(':input').each(function () {
					const attributeField = $(this);
					const attributeVal = attributeField.val();
					const attributeName = attributeField.prop('name');

					if (attributeField.is('.checkbox') && !attributeField.is(':checked')) {
						return true; // skip unchecked checkboxes
					}

					if (attributeVal !== '') {
						if (attributeName.indexOf('[') > -1) {
							const key = attributeName.substring(0, attributeName.indexOf('['));
							if (typeof attributes[key] !== 'undefined') {
								attributes[key] += `,${attributeVal}`;
							} else {
								attributes[key] = attributeVal;
							}
						} else if (attributeField.is('.checkbox')) {
								attributes[attributeField.prop('name')] = attributeField.is(':checked') ? 1 : 0;
							} else {
								attributes[attributeField.prop('name')] = attributeVal;
							}
					}
				});
			}

			return {
				shortcodeType: this.find(':input[name=CallToActionType]').val().replaceAll(/\\/g, '_'),
				attributes
			};
		},

		resetFields() {
			this._super();
			// trigger a change on the shortcode type field to reload all fields
			this.find(':input[name=CallToActionType]').val('');
			this.find('.attributes-composite').hide();
			this.find('#id.field').hide();
		},
		/**
		 * Updates the state of the dialog inputs to match the editor selection.
		 * If selection does not contain a shortcode, resets the fields.
		 */
		updateFromEditor() {
			const shortcode = this.getCurrentShortcode().trim();
			this.reloadForm('shortcode', shortcode);
		},
		getCurrentShortcode() {
			let selection = $(this.getSelection()),
			    selectionText = selection.text();
			    
			if (selection.data('cta-shortcode') !== undefined) {
				const $elm = selection;
				const code = $elm.data('cta-shortcode');
				const wrapped = $elm.data('cta-shortcode-wrapped');
				const properties = $elm.data('cta-shortcode-properties');
				const content = $elm.data('cta-shortcode-content');

				const shortcode = ShortcodeSerialiser.serialise({
					name: code,
					properties: properties,
					content: content,
					wrapped: wrapped
				}, true);

				return shortcode;
			}
			return selectionText;
		},
		fromDialog: {
			onssdialogopen: function() {
				let editor = this.getEditor().getInstance();
				this.setBookmark(this.parent().getBookmark());
				editor.selection.moveToBookmark(this.parent().getBookmark());
      			
      			this.setSelection(editor.selection.getNode());

				this.find(':input:not(:submit)[data-skip-autofocus!="true"]').filter(':visible:enabled').eq(0).focus();

				this.redraw();
				this.updateFromEditor();
			},

			onssdialogclose: function(){
				var ed = this.getEditor();
				ed.onclose();

				ed.moveToBookmark(this.getBookmark());

				this.setSelection(null);
				this.setBookmark(null);

				this.resetFields();
			}
		},
	});
});

// Adds the plugin class to the list of available TinyMCE plugins
tinymce.PluginManager.add(commandName, (editor) => plugin.init(editor));

export default plugin;

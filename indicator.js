/* Mailnag - GNOME-Shell extension frontend
*
* Copyright 2013 Patrick Ulbrich <zulu99@gmx.net>
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
* MA 02110-1301, USA.
*/

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

const INDICATOR_ICON = 'mail-unread-symbolic'

const IndicatorMailMenuItem = new Lang.Class({
	Name: 'IndicatorMailMenuItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(sender, subject) {
		this.parent();
		
		let hbox = new St.BoxLayout({ vertical: false, x_expand: true, style_class: 'menu-item-box' });
		let vbox = new St.BoxLayout({ vertical: true, x_expand: true });
		
		let senderLabel = new St.Label({ text: sender, style_class: 'sender-label' });
		let subjectLabel = new St.Label({ text: subject, style_class: 'subject-label' });
		
		vbox.add(senderLabel);
		vbox.add(subjectLabel);
		
		hbox.add(vbox);
		
		let closeButton = new St.Button({ reactive: true, can_focus: true, 
										  track_hover: true, style_class: 'mark-as-read-button' });
		
		closeButton.child = new St.Icon({ icon_name: 'edit-delete-symbolic', 
								style_class: 'popup-menu-icon' });
		
		//hbox.add(closeButton);

		this.actor.add_child(hbox);
	}
});

const MailnagIndicator = new Lang.Class({
	Name: 'MailnagIndicator',
	Extends: PanelMenu.Button,
	
	_init: function(maxVisibleMails) {
		this.parent(0.0, this.Name);
		this._maxVisisbleMails = maxVisibleMails;
		
		let icon = new St.Icon({
			icon_name: INDICATOR_ICON,
			style_class: 'system-status-icon'});

		this._iconBin = new St.Bin({ child: icon,
									 /*width: icon.width, height: icon.height,*/
									 x_fill: true,
									 y_fill: true });

		this._counterLabel = new St.Label({ text: "0",
											x_align: Clutter.ActorAlign.CENTER,
											x_expand: true,
											y_align: Clutter.ActorAlign.CENTER,
											y_expand: true });
		
		this._counterBin = new St.Bin({ style_class: 'mailnag-counter',
										child: this._counterLabel,
										layout_manager: new Clutter.BinLayout() });

		this._counterBin.connect('style-changed', Lang.bind(this, function() {
			let themeNode = this._counterBin.get_theme_node();
			this._counterBin.translation_x = themeNode.get_length('-mailnag-counter-overlap-x');
			this._counterBin.translation_y = themeNode.get_length('-mailnag-counter-overlap-y');
		}));
            
        this.actor.add_actor(this._iconBin);                      
		this.actor.add_actor(this._counterBin);
	},
	
	_allocate: function(actor, box, flags) {
		// the iconBin should fill our entire box
		this._iconBin.allocate(box, flags);

		let childBox = new Clutter.ActorBox();

		let [minWidth, minHeight, naturalWidth, naturalHeight] = this._counterBin.get_preferred_size();
		let direction = this.actor.get_text_direction();

		if (direction == Clutter.TextDirection.LTR) {
			// allocate on the right in LTR
			childBox.x1 = box.x2 - naturalWidth;
			childBox.x2 = box.x2;
		} else {
			// allocate on the left in RTL
			childBox.x1 = 0;
			childBox.x2 = naturalWidth;
		}

		childBox.y1 = box.y2 - naturalHeight;
		childBox.y2 = box.y2;

		this._counterBin.allocate(childBox, flags);
    },
    
    _getPreferredWidth: function (actor, forHeight, alloc) {
        let [min, nat] = this._iconBin.get_preferred_width(forHeight);
        alloc.min_size = min; alloc.nat_size = nat;
    },

    _getPreferredHeight: function (actor, forWidth, alloc) {
        let [min, nat] = this._iconBin.get_preferred_height(forWidth);
        alloc.min_size = min; alloc.nat_size = nat;
    },
	
	_updateMenu: function(mails) {
		this.menu.removeAll();
		
		let maxMails = (mails.length <= this._maxVisisbleMails) ? 
							mails.length : this._maxVisisbleMails;
		
		for (let i = 0; i < maxMails; i++) {
			let sender = mails[i]['sender_name'].get_string()[0];
			if (sender.length == 0) sender = mails[i]['sender_addr'].get_string()[0];
			let subject = mails[i]['subject'].get_string()[0];
			let item = new IndicatorMailMenuItem(sender, subject);
			
			this.menu.addMenuItem(item);
		}
		
		if (mails.length > this._maxVisisbleMails) {
			let str = _("(and {0} more)").replace("{0}", (mails.length - this._maxVisisbleMails));
			let item = new PopupMenu.PopupBaseMenuItem();
			item.actor.style_class = 'menu-item-more-box';
			item.actor.add_child(new St.Label({ text: str }));
			
			this.menu.addMenuItem(item);
		}
	},
	
	setMails: function(mails) {
		this._counterLabel.set_text(mails.length.toString());
		this._updateMenu(mails);
	}
});
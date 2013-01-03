/**
 Copyright 2012 Red Hat, Inc.

 This software is licensed to you under the GNU General Public
 License as published by the Free Software Foundation; either version
 2 of the License (GPLv2) or (at your option) any later version.
 There is NO WARRANTY for this software, express or implied,
 including the implied warranties of MERCHANTABILITY,
 NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 have received a copy of GPLv2 along with this software; if not, see
 http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
*/



KT.repo_discovery = (function(){
    var updater = undefined,
        form_id = '#repo_discovery_form',
        list_id = '#discovered_repos';

    var page_load = function(){
        draw_url_list(KT.initial_repo_discovery.urls);
        if(KT.initial_repo_discovery.running){
            discovery_started();
            disable_discovery();
        }
        $(form_id).unbind('submit');
        $(form_id).submit(function(e){
            e.preventDefault();
            start_discovery();
        });
        $('#new_repos').unbind('click');
        $('#new_repos').click(open_subpane);
        init_cancel();
    },
    open_subpane = function(){
        var urls = '?';
        KT.utils.each(selected(), function(element, index){
           if(index > 0) {
               urls += '&';
           }
           urls+= 'urls[]=' + element;
        });
        KT.panel.openSubPanel($(this).data('url') + urls );
    },
    page_close = function(){
        if(updater !== undefined){
            updater.stop();
            updater = undefined;
        }
    },
    init_updater = function(){
        var url = $(list_id).data('url');
        if(updater !== undefined){
            return;
        }
        updater = $.PeriodicalUpdater(url, {
              method: 'get',
              type: 'json',
              global: 'false'
            },
            function(data, success) {
                if(data !== '') { //403
                    draw_url_list(data.urls);
                    if(!data.running){
                        discovery_ended();
                    }
                }
            });
    },
    init_cancel = function(){
        var cancel = $(form_id).find('#cancel_discover');
        cancel.unbind('click');
        cancel.click(cancel_discovery);
    },
    draw_url_list = function(url_list){
        KT.initial_repo_discovery.urls = url_list;
        $(list_id).html(KT.discovery_templates.url_list(url_list, selected()));
    },
    start_discovery = function(){
        var form = $(form_id),
            discover_url = form.find('input[type=text]').val();

        disable_discovery();
        $.ajax({
            contentType:"application/json",
            type: "POST",
            url: form.data('url'),
            data: JSON.stringify({'url':discover_url}),
            cache: false,
            success: function(data) {
                discovery_started();
            },
            error: function(data) {
                enable_discovery();
            }
        });
        draw_url_list([]);
    },
    cancel_discovery = function(){
        var button = $(form_id).find('#cancel_discover');
        button.attr('disabled', 'disabled');
        $.ajax({
            contentType:"application/json",
            type: "POST",
            url: button.data('url'),
            cache: false,
            success: function(data) {
            },
            error: function(data) {
                button.removeAttr('disabled');
            }
        });

    },
    disable_discovery = function(){
        var form = $(form_id);
        form.find('input[type=text]').attr('disabled', 'disabled');
        form.find('input[type=submit]').parent().hide();
        form.find('#cancel_discover').removeAttr('disabled');
        form.find('#cancel_discover').parent().show();
    },
    enable_discovery = function(){
        var form = $(form_id);
        form.find('input[type=text]').removeAttr('disabled');
        form.find('input[type=submit]').parent().show();
        form.find('#cancel_discover').parent().hide();
    },
    discovery_started = function() {
        $(list_id).html('');
        init_updater();
    },
    discovery_ended = function(){
        updater.stop();
        KT.initial_repo_discovery.running = false;
        updater = undefined;
        enable_discovery();
    },
    selected = function(){
        var to_ret = [];
        KT.utils.each($(list_id).find(":checked"), function(element){
            to_ret.push($(element).val());
        });
        return to_ret;
    },
    clear_selections = function(){
        $(list_id).find(":checked").removeAttr('checked');
    };

    return {
        page_load: page_load,
        page_close: page_close,
        clear_selections: clear_selections
    }
})();


KT.discovery_templates = (function(){
    var url_list = function(url_list, selected_list){
        var html = '<table>';

        if(selected_list === undefined){
            selected_list = [];
        }
        KT.utils.each(url_list, function(elem){
            html += url_list_item(elem, selected_list);
        });
        html += '</table>';
        return html;
    },
    url_list_item = function(item, selected_list){
        var selected = '',
            html = '';
        if (KT.utils.indexOf(selected_list, item.url) !== -1){
            selected = 'checked';
        }
        html = '<tr><td><label><input type="checkbox"' + selected + ' value="' + item.url + '"/>' + item.url + '</label></td></tr>';
        return html;
    };

    return {
        url_list:url_list
    }

})();


KT.repo_discovery.new = (function(){
    var panel_id = '#repo_creation',
        product_select_id = "#existing_product_select",
        form_id = '#discovered_creation',
        product_details = '#product_details';


    var init_panel = function(){
        $(product_select_id).chosen();
        $(panel_id).find('input[type=radio]').change(radio_change);
        $(form_id).submit(submit_form);
        $(window).unbind('repo.create');
        $(window).bind('repo.create', create_repos);
    },
    submit_form = function(event) {
        event.preventDefault();
        var form = $(form_id),
            product_details = form.find('#product_details'),
            product_id, name, label, provider_id;

        disable_form();

        if (product_details.find('input[type=radio]:checked').val() == 'true'){
            name = product_details.find('input[type=text][name=product_name]').val();
            label = product_details.find('input[type=text][name=product_label]').val();
            create_product(name, label, $('#new_product').data('url'));
        }
        else {
            product_id = $(product_select_id).val();
            initiate_repo_creation(product_id);
        }

    },
    initiate_repo_creation = function(product_id) {
        var repos = [],
            provider_id = $(form_id).data('provider_id'),
            create_url = KT.routes.provider_product_repositories_path(provider_id, product_id);

        KT.utils.each($('.new_repo'), function(repo_div){
            repo_div = $(repo_div);
            var name = repo_div.find('.name_input').val(),
                label = repo_div.find('.label_input').val(),
                url = repo_div.find('input[type=hidden]').val(),
                id = '#' + repo_div.attr('id');
            repos.push({name:name, label:label, feed:url, id:id})
        });
        $(window).trigger('repo.create', [create_url, repos]);
    },
    create_product = function(name, label, create_url){
        $.ajax({
            url:create_url,
            type: 'POST',
            data: {product:{name:name, label:label}},
            success: function(data){
                var product_div = $('#new_product');
                product_div.find('.name_input').replaceWith(name);
                product_div.find('.label_input').replaceWith(label);
                initiate_repo_creation(data.id);
            },
            error: function(){
                enable_form();
            }
        });
    },
    create_repos = function(event, create_url, repo_list){
        var repo = repo_list.shift();

        $.ajax({
            url:create_url,
            type: 'POST',
            data: {'repo':repo},
            success:function(){
                var repo_div = $(repo.id);
                repo_div.removeClass('new_repo');
                repo_div.find('.name_input').replaceWith(repo.name);
                repo_div.find('.label_input').replaceWith(repo.label);

                if (repo_list.length !== 0){
                    $(window).trigger('repo.create', [create_url, repo_list]);
                }
                else {
                    KT.repo_discovery.clear_selections();
                    KT.panel.closeSubPanel($('#subpanel'));
                }
            },
            error: function(){
                enable_form();
            }
        });


    },
    disable_form = function(){
        $(form_id).find('input').attr('disabled', 'disabled');
        $(product_select_id).attr('disabled', true).trigger("liszt:updated");
    },
    enable_form = function(){
        $(form_id).find('input').removeAttr('disabled');
        $(product_select_id).attr('disabled', false).trigger("liszt:updated");
    },
    radio_change = function(){
        if ($(this).val() === 'true'){
            $(product_select_id).attr('disabled', true).trigger("liszt:updated");
            $('#new_product').show();
        }
        else {
            $(product_select_id).attr('disabled', false).trigger("liszt:updated");
            $('#new_product').hide();
        }
    };



    return {
        init_panel:init_panel
    }
})();
#
# Copyright 2013 Red Hat, Inc.
#
# This software is licensed to you under the GNU General Public
# License as published by the Free Software Foundation; either version
# 2 of the License (GPLv2) or (at your option) any later version.
# There is NO WARRANTY for this software, express or implied,
# including the implied warranties of MERCHANTABILITY,
# NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
# have received a copy of GPLv2 along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.

require 'spec_helper'

describe SyncSchedulesController, :katello => true do
  include LoginHelperMethods
  include LocaleHelperMethods
  include OrganizationHelperMethods
  include ProductHelperMethods
  include OrchestrationHelper
  include AuthorizationHelperMethods

  describe "rules" do
    before (:each) do
      new_test_org
    end
    describe "GET index" do
      before do
        @provider = Provider.create!(:provider_type=>Provider::CUSTOM, :name=>"foo1", :organization=>@organization)
      end
      let(:action) {:index}
      let(:req) { get :index}
      let(:authorized_user) do
        user_with_permissions { |u| u.can(:read, :providers, @provider.id, @organization) }
      end
      let(:unauthorized_user) do
        user_without_permissions
      end
      it_should_behave_like "protected action"
    end

    describe "Manage test" do
      before do
        @controller.stub!(:find_products).and_return({})
      end
      let(:action) {:apply}
      let(:req) { post :apply}
      let(:authorized_user) do
        user_with_permissions { |u| u.can(:sync, :organizations, nil, @organization) }
      end
      let(:unauthorized_user) do
        user_without_permissions
      end
      it_should_behave_like "protected action"
    end
  end

  describe "others" do
    before (:each) do
      login_user
      set_default_locale

      @org = new_test_org
      for i in 1..10
        @plan = SyncPlan.create!(:name => 'some plan_' + i.to_s,
                                    :sync_date => DateTime.now, :interval => 'daily',
                                      :organization => @org)
      end
      @p = new_test_product(@org, @org.library)
      controller.stub!(:current_organization).and_return(@org)
    end

    describe "GET 'index'" do
      it "should be successful" do
        get 'index'
        response.should be_success
      end
    end

    describe "POST 'apply'" do
      it "should receive a notice" do
        controller.should notify.success
        plans = [SyncPlan.first.id.to_s]
        products = [Product.first.id.to_s]
        post 'apply', {:data => {:plans=> plans, :products=> products}.to_json}
      end
    end
  end


end

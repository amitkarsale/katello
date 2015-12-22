/**
 * @ngdoc service
 * @name  Bastion.subscriptions.service:SubscriptionsHelper
 *
 * @description
 *   Helper service that contains functionality common amongst subscriptions.
 */
angular.module('Bastion.subscriptions').service('SubscriptionsHelper',
    function () {

        this.groupByProductName = function (rows) {
            var grouped,
                offset,
                subscription;

            grouped = {};
            for (offset = 0; offset < rows.length; offset += 1) {
                subscription = rows[offset];
                if (angular.isUndefined(grouped[subscription.name])) {
                    grouped[subscription.name] = [];
                }
                grouped[subscription.name].push(subscription);
            }

            return grouped;
        };

        this.getSelectedSubscriptionAmounts = function (table) {
            var selected,
                amount;

            selected = [];
            angular.forEach(table.getSelected(), function (subscription) {
                if (subscription['multi_entitlement']) {
                    amount = subscription.amount;
                    if (!amount) {
                        amount = 0;
                    }
                } else {
                    amount = 1;
                }
                selected.push({"id": subscription.id, "quantity": amount});
            });
            return selected;
        };

        this.getSelectedSubscriptions = function (table) {
            var selected;

            selected = [];
            angular.forEach(table.getSelected(), function (subscription) {
                selected.push({"id": subscription.cp_id});
            });
            return selected;
        };

    }
);

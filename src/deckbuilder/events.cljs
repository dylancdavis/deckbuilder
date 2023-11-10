(ns deckbuilder.events
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.db :as db]
   [deckbuilder.game.round :as round]
   [deckbuilder.game.cards :as cards]))

(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))

(re-frame/reg-event-db
 :advance-game
 (fn [db _]
   (update-in db [:round :deck] round/advance-deck)))

(re-frame/reg-event-db
 :add-energy
 (fn [db _]
   (update-in db [:resources :energy :value] inc)))

(re-frame/reg-event-db
 :generate-credit
 (fn [db _]
   (if
    (>= (get-in db [:resources :energy :value]) 3)
     (-> db (update-in [:resources :energy :value] #(- % 3))
         (update-in [:resources :credits :value] inc)) db)))

(re-frame/reg-event-db
 :select-deck
 (fn [db [_ deck-name]]
   (assoc-in db [:view-data :selected-deck] deck-name)))

(re-frame/reg-event-db
 :start-run
 (fn [db [_ deck]]
   (assoc db
          :view :round
          :round {:deck (round/starting-round-data-from-deck deck) :resources round/starting-resources})))

(re-frame/reg-event-db
 :end-run
 (fn [db _]
   (assoc db
          :view :collection
          :round nil)))

(re-frame/reg-event-db
 :gain-resource
 (fn [db [_ resource-name amount]]
   (update-in db [:round :resources resource-name :value] + amount)))

(re-frame/reg-event-db
 :buy-basic
 (fn [db _]
   (assoc-in db [:view-data :modal-view] :buy-basic)))

(defn remove-modal-view [db] (update-in db [:view-data] #(dissoc % :modal-view)))

(re-frame/reg-event-db
 :clear-modal-view
 (fn [db _]
   (update-in db [:view-data] #(dissoc % :modal-view))))

(defn conj-to-cards [db card] (update-in db [:collection :cards] #(conj % [card 1])))

(re-frame/reg-event-db
 :add-to-collection
 (fn [db [_ card]] (conj-to-cards db card)))
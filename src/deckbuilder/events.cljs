(ns deckbuilder.events
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.db :as db]
   [deckbuilder.game.round :as round]))

(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))

(re-frame/reg-event-db
 :advance-game
 (fn [db _]
   (update db :round (round/advance-deck {:round db}))))

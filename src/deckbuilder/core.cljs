(ns deckbuilder.core
  (:require
   [reagent.dom :as rdom]
   [re-frame.core :as re-frame]
   [deckbuilder.events :as events]
   [deckbuilder.events.collection :as collection-events]
   [deckbuilder.views.main :as views]
   [deckbuilder.config :as config]))

(defn dev-setup []
  (when config/debug?
    (println "dev mode")))

(defn ^:dev/after-load mount-root []
  (re-frame/clear-subscription-cache!)
  (let [root-el (.getElementById js/document "app")]
    (rdom/unmount-component-at-node root-el)
    (rdom/render [views/app] root-el)))

(defn init []
  (re-frame/dispatch-sync [::events/initialize-db])
  (dev-setup)
  (mount-root))

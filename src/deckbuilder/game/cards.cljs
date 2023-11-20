(ns deckbuilder.game.cards)

(def energy {:name "Energize"
             :description "Gain 1 Energy."
             :event [:gain-resource :energy 1]
             :cost 0})

(def credit-generator {:name "Credit Generator"
                       :description "Convert 3 Energy to 1 Credit."
                       :event [:gain-resource :credits 1]
                       :cost 1})

(def buy-basic {:name "Buy Basic"
                :description "Buy a Basic Card."
                :event [:buy-basic]
                :cost 2})

(def basic-rules {:name "Basic Rules"
                  :type :rules
                  :deck-size 10
                  :total-rounds 1
                  :turn {:draw-amount 1 :play-amount 1}
                  :cost 1})

(def basic-cards #{energy credit-generator buy-basic basic-rules})

(def starting-deck-list (concat (take 7 (repeat energy)) (take 3 (repeat credit-generator))))

(defn with-keys [coll]
  (map-indexed (fn [idx item] (assoc item :key idx)) coll))

(def starting-round {:draw-pile (with-keys starting-deck-list) :hand nil
                     :discard-pile []})

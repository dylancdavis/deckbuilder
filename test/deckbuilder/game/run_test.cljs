(ns deckbuilder.game.run-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.game.run :refer [move-cards populate-draw-pile process-start-of-game draw-first-hand]]))

(def base-rules {:name "Example Rules"
                 :type :rules
                 :deck-limits {:size [0,0]}
                 :turn-structure {:draw-amount 1
                                  :play-amount 1}
                 :end-conditions {:rounds 1}
                 :effects nil
                 :cost 2})

(def rules-with-added-cards {:name "Example Rules"
                             :type :rules
                             :deck-limits {:size [0,0]}
                             :turn-structure {:draw-amount 1
                                              :play-amount 1}
                             :end-conditions {:rounds 1}
                             :effects {:game-start [[:add-cards :draw-pile {:foo 2 :bar 2}]]}
                             :cost 2})

(def pre-move-run {:cards {:draw-pile '(:a :b :c :d :e) :hand '(:f :g :h :i) :discard-pile '()}})

(deftest move-cards-test
  (is (= (move-cards pre-move-run :draw-pile :hand 3) 
         {:cards {:draw-pile '(:d :e) :hand '(:c :b :a :f :g :h :i) :discard-pile '()}}) "Should move top 3 cards from draw-pile to hand")
  (is (= (move-cards pre-move-run :draw-pile :discard-pile 3) 
         {:cards {:draw-pile '(:d :e) :hand '(:f :g :h :i) :discard-pile '(:c :b :a)}}) "Should move top 3 cards from draw-pile to discard"))

(def example-counter {:a 3 :b 2 :c 1})

(def empty-hand-run
  {:resources {:points 0}
   :cards {:draw-pile '() :hand '() :discard-pile '()}
   :deck-info {:cards example-counter :rules-card rules-with-added-cards}
   :data {}
   :effects []
   :outcomes []})

(def populate-with-identity #(populate-draw-pile % identity))

(deftest populate-draw-pile-test
  (is (= example-counter (-> empty-hand-run populate-with-identity :cards :draw-pile frequencies))
      "Should add cards to draw-pile from deck"))

(def populated-hand-run
  {:resources {:points 0}
   :cards {:draw-pile '(:a :a :a :b :b :c) :hand '() :discard-pile '()}
   :deck-info {:cards example-counter :rules-card rules-with-added-cards}
   :data {}
   :effects []
   :outcomes []})

(def populated-hand-run-no-added
  {:resources {:points 0}
   :cards {:draw-pile '(:a :a :a :b :b :c) :hand '() :discard-pile '()}
   :deck-info {:cards example-counter :rules-card base-rules}
   :data {}
   :effects []
   :outcomes []})

(def process-start-with-identity #(process-start-of-game % identity))

(deftest process-start-of-game-test
  (is (=
       (-> populated-hand-run-no-added process-start-with-identity :cards :draw-pile)
       (get-in populated-hand-run-no-added [:cards :draw-pile]))
      "Shouldn't modify cards in draw-pile when no cards are added")
  (is (=
       (-> populated-hand-run process-start-with-identity :cards :draw-pile frequencies)
       {:a 3 :b 2 :c 1 :foo 2 :bar 2})
      "Should add cards to draw-pile from rules card")
  (is (=
       (filter #(not (or (= % :foo) (= % :bar))) (-> populated-hand-run process-start-with-identity :cards :draw-pile))
       (get-in populated-hand-run [:cards :draw-pile]))
      "Should preserve original draw order when cards are added"))

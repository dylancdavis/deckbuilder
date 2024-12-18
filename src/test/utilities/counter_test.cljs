(ns test.utilities.counter-test
  (:require [cljs.test :refer [deftest testing is]]
            [deckbuilder.utilities.counter :refer [add sub merge-counters]]))

(deftest counter 
  (testing "Counter"
    (testing "adds correctly"
      (is (= (add {} :a) {:a 1}))
      (is (= (add {:a 1} :a) {:a 2}))
      (is (= (add {:a 1} :b) {:a 1 :b 1})))
    (testing "subtracts correctly"
      (is (= (sub {:a 1} :a) {}))
      (is (= (sub {:a 2} :a) {:a 1}))
      (is (= (sub {:a 2} :b) {:a 2}))
      (is (= (sub {:a 2} :a 3) {})))
    (testing "merges correctly"
      (is (= (merge-counters {:a 1} {:b 2}) {:a 1 :b 2}))
      (is (= (merge-counters {:a 1} {:a 2}) {:a 3})))))
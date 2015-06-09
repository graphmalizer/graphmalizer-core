
some sort of graphmalizer, take sets of documents into elasticsearch and neo.

see [ABOUT](ABOUT.md)

```
------------------------------
[32mdataset: [39m bag.nl.straten
[32mtype: [39m    LIES_IN
[32mid: [39m      [90mnull[39m
[32mdocument: [39m
  [32mfrom: [39m2345
  [32mto: [39m  foo/234
------------------------------
[32mES: [39m
  [32mindex: [39mbag
  [32mtype: [39m LIES_IN
  [32mid: [39m   bag/bag.2345--LIES_IN--foo.234
[32mNeo: [39m
  [32mlabels: [39m
    [32m- [39mT_LIES_IN
    [32m- [39mI_bag.nl.straten
    [32m- [39m__
  [32mid: [39m    bag/bag.2345--LIES_IN--foo.234
  [32msource: [39mbag/2345
  [32mtarget: [39mfoo/234 


------------------------------
[32mdataset: [39m bag.nl.straten
[32mtype: [39m    LIES_IN
[32mid: [39m      123
[32mdocument: [39m
  [32mfrom: [39m2345
  [32mto: [39m  foo/234
------------------------------
[32mES: [39m
  [32mindex: [39mbag
  [32mtype: [39m LIES_IN
  [32mid: [39m   bag/123
[32mNeo: [39m
  [32mlabels: [39m
    [32m- [39mT_LIES_IN
    [32m- [39mI_bag.nl.straten
    [32m- [39m__
  [32mid: [39m    bag/123
  [32msource: [39mbag/2345
  [32mtarget: [39mfoo/234 


------------------------------
[32mdataset: [39m bag.nl.straten
[32mtype: [39m    PIT
[32mid: [39m      123
[32mdocument: [39m
  [32ma: [39m[34m2345[39m
------------------------------
[32mES: [39m
  [32mindex: [39mbag
  [32mtype: [39m PIT
  [32mid: [39m   bag/123
[32mNeo: [39m
  [32mlabels: [39m
    [32m- [39mT_PIT
    [32m- [39mI_bag.nl.straten
    [32m- [39m__
  [32mid: [39m    bag/123 
```

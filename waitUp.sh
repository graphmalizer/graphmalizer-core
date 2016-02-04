# function to test if http is up
http_okay () {
  res=`curl -fsI $1 | grep HTTP/1.1 | awk {'print $2'}`
  if [ "$res" = "200" ];
  then
    echo testing $1, status is: OK;
    return 0;
  else
    echo testing $1, status is: not okay;
    return 1;
  fi
}

HOST=$NEO4J_PORT_7474_TCP_ADDR
PORT=$NEO4J_PORT_7474_TCP_PORT

echo Docker link address: $HOST
echo Docker link port: $PORT

# wait until neo4j is up
until http_okay $HOST:$PORT;
do
  sleep 3s;
done;

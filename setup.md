# Master Slave Setup

## Prerequisites

### To complete this guide, you will need:

Two servers running Ubuntu 20.04. Both should have a non-root administrative user with sudo privileges and a firewall configured with UFW. Follow the [initial server setup](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-20-04) guide for Ubuntu 20.04 to set up both servers.

## Things to note:

- Master server will be referred to as `source` in this guide.
- Slave server will be referred to as `replica` in this guide.

## Step 1: Install & Configure MySQL on both source & replica

### Install

Update deps with this command:

```bash
sudo apt update
```

Then install the mysql-server package:

```bash
sudo apt install mysql-server
```

Ensure that the server is running using the systemctl start command:

```bash
sudo systemctl start mysql.service
```

### Configure

Access mysql by

```bash
sudo mysql -u root -p
```

Run to create root user, make sure to create a root_password

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '#SecurePassword1';
```

Then exit mysql

```bash
exit
```

Run the security script with sudo

```bash
sudo mysql_secure_installation
```

This will take you through a series of prompts where you can make some changes to your MySQL installation’s security options. The first prompt will ask whether you’d like to set up the Validate Password Plugin, which can be used to test the password strength of new MySQL users before deeming them valid.

If you elect to set up the Validate Password Plugin, any MySQL user you create that authenticates with a password will be required to have a password that satisfies the policy you select. The strongest policy level — which you can select by entering 2 — will require passwords to be at least eight characters long and include a mix of uppercase, lowercase, numeric, and special characters:

Once done, change the security method for root user
```bash
mysql -u root -p
```


```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH auth_socket;
```

#### Create a user from which you'll connect to the database

Create a user

```sql
CREATE USER 'app'@'localhost' IDENTIFIED WITH mysql_native_password BY '#SecurePassword1';
```

Grant the privilege which you want to provide

```sql
GRANT <PRIVILEGE> ON <database.table> TO 'app'@'localhost';
```

You might want to grant these privileges:

```sql
GRANT CREATE, ALTER, DROP, INSERT, UPDATE, INDEX, DELETE, SELECT, REFERENCES, RELOAD on *.* TO 'app'@'localhost' WITH GRANT OPTION;
```

Then flush privileges & exit

```sql
FLUSH PRIVILEGES;
exit
```

In the future, to log in as your new MySQL user, you’d use a command like the following:

```bash
mysql -u app -p
```

## Setup server for replication

To set up MySQL replication between a source and a replica server, follow these steps:

### Step 1: Configure Firewall on the Source Server

1. **Allow MySQL Connections from the Replica Server:**
   Run the following command on your source server to allow connections from the replica server:
   ```bash
   sudo ufw allow from replica_server_ip to any port 3306
   ```
   Replace `replica_server_ip` with your actual source server's IP.


2. **Edit MySQL Configuration:**
   Open the MySQL configuration file on your source server:
   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   ```
3. **Update Bind Address:**
   Replace the bind-address with your source server’s IP address(or the ip where you want to listen for db requests, which could be localhost if app is hosted in the same server, or a private ip address):

   ```plaintext
   bind-address = source_server_ip
   ```

   Replace `source_server_ip` with your actual source server's IP.
4. **Set Server ID:**
   Uncomment the `server-id` line and set a unique ID:

   ```plaintext
   server-id = 1
   ```

5. **Enable Binary Logging:**
   Uncomment the `log_bin` directive to enable binary logging:

   ```plaintext
   log_bin = /var/log/mysql/mysql-bin.log
   ```

6. **Specify Databases to Replicate:**
   Uncomment and set the `binlog_do_db` directive to specify the database you want to replicate:

   ```plaintext
   binlog_do_db = db
   ```

   If you want to replicate more than one database, you can add another `binlog_do_db` directive for every database you want to include. Below is an example of how this would look:

   ```ini
   # /etc/mysql/mysql.conf.d/mysqld.cnf
   . . .
   binlog_do_db = db
   binlog_do_db = db_1
   binlog_do_db = db_2
   ```

7. **Restart MySQL:**
   Apply the changes by restarting MySQL:
   ```bash
   sudo systemctl restart mysql
   ```

### Step 3: Create a Replication User

1. **Open MySQL Shell:**

   ```bash
   sudo mysql -u root -p
   ```

2. **Create a Replication User:**
   ```sql
   CREATE USER 'replica2'@'replica_server_ip' IDENTIFIED WITH mysql_native_password BY '#SecurePassword1';
   GRANT REPLICATION SLAVE ON *.* TO 'replica2'@'replica_server_ip';
   FLUSH PRIVILEGES;
   ```

### Step 4: Obtain Binary Log Coordinates

1. **Lock Tables:**

   ```sql
   FLUSH TABLES WITH READ LOCK;
   ```

2. **Get Master Status:**

   ```sql
   SHOW MASTER STATUS;
   ```

   Note down the `File` and `Position` values.

3. **Unlock Tables:**
   ```sql
   UNLOCK TABLES;
   ```

### Step 5: Configure the Replica MySQL Database

1. **Edit MySQL Configuration:**
   Open the MySQL configuration file on your replica server:

   ```bash
   sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
   ```

2. **Set Server ID:**
   Set a unique `server-id` different from the source:

   ```plaintext
   server-id = 2
   ```

3. **Enable Binary Logging and Relay Log:**

   ```plaintext
   log_bin = /var/log/mysql/mysql-bin.log
   relay-log = /var/log/mysql/mysql-relay-bin.log
   binlog_do_db = db
   ```

4. **Restart MySQL:**
   Apply the changes by restarting MySQL:
   ```bash
   sudo systemctl restart mysql
   ```

### Step 6: Start Replication on the Replica Server

1. **Open MySQL Shell on the Replica:**
   ```bash
   sudo mysql -u root -p
   ```

2. **Configure Replication Settings:** Make sure to put the `File` And `Position` Values here, and make sure that the user should be of the `replica_user` which was created.

   ```sql
   CHANGE REPLICATION SOURCE TO
   SOURCE_HOST='source_server_ip',
   SOURCE_USER='replica2',
   SOURCE_PASSWORD='#SecurePassword1',
   SOURCE_LOG_FILE='mysql-bin.000001',
   SOURCE_LOG_POS=899;
   ```
3. **Start Replication:**

   ```sql
   START REPLICA;
   ```

4. **Verify Replication Status:**
   ```sql
   SHOW REPLICA STATUS\G;
   ```

### Step 7: Test Replication

1. **Create a Table on the Source:** (Note, this doesn't need to be done for prisma, as tables can be created using prisma)

   ```sql
   USE db;
   CREATE TABLE example_table (example_column varchar(30));
   ```

2. **Check the Table on the Replica:**

   ```sql
   USE db;
   SHOW TABLES;
   ```

   If the table appears on the replica, replication is working correctly.

This completes the basic setup of MySQL replication between your source and replica servers. Any changes made to the `db` database on the source will now be reflected on the replica.

### Sources:

- https://www.digitalocean.com/community/tutorials/how-to-set-up-replication-in-mysql#step-1-adjusting-your-source-server-s-firewall
- https://www.digitalocean.com/community/tutorials/how-to-install-mysql-on-ubuntu-20-04

## Setup Prisma

- Create a new mysql user on both the VMs, and create new mysql user using [this docs](https://www.digitalocean.com/community/tutorials/how-to-create-a-new-user-and-grant-permissions-in-mysql)

- You can add an additional DB to prisma using [this docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/read-replicas)

- Incase you are beginner at prisma, check out [this docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/introduction)

## Disclaimer

There might be incorrect info, please report incase you find any
